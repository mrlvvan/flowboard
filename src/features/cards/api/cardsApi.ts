import { supabase } from "@/shared/lib/supabase";
import { positionBetween } from "@/shared/lib/position";
import { isNetworkError } from "@/shared/lib/networkError";
import { db } from "@/db/schema";
import { enqueue } from "@/db/syncQueue";
import type { Tables } from "@/shared/lib/database.types";

export type Card = Tables<"cards">;

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function fetchCards(boardId: string): Promise<Card[]> {
  try {
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("board_id", boardId)
      .order("position");

    if (error) throw error;

    // Keep Dexie in sync when we're online
    await db.cards.bulkPut(data);
    return data;
  } catch (err) {
    if (isNetworkError(err)) {
      // Fall back to local IndexedDB
      const local = await db.cards.where("board_id").equals(boardId).toArray();
      return local.sort((a, b) => a.position.localeCompare(b.position));
    }
    throw err;
  }
}

// ─── Write ─────────────────────────────────────────────────────────────────────

export async function createCard(
  boardId: string,
  columnId: string,
  title: string,
  afterPosition?: string
): Promise<Card> {
  const position = positionBetween(afterPosition, undefined);
  const now = new Date().toISOString();

  if (!navigator.onLine) {
    // Offline path: generate a local UUID and queue for later
    const id = crypto.randomUUID();
    const card: Card = {
      id,
      board_id: boardId,
      column_id: columnId,
      title,
      position,
      description: null,
      due_date: null,
      labels: [],
      created_at: now,
      updated_at: now,
    };
    await db.cards.put(card);
    await enqueue("cards", "create", id, card);
    return card;
  }

  const { data, error } = await supabase
    .from("cards")
    .insert({ board_id: boardId, column_id: columnId, title, position })
    .select()
    .single();

  if (error) throw error;
  await db.cards.put(data);
  return data;
}

export async function updateCard(
  id: string,
  patch: {
    title?: string;
    description?: string | null;
    column_id?: string;
    position?: string;
    due_date?: string | null;
    labels?: string[];
  }
): Promise<Card> {
  const now = new Date().toISOString();

  if (!navigator.onLine) {
    const existing = await db.cards.get(id);
    if (!existing) throw new Error("Card not found locally");
    const updated: Card = { ...existing, ...patch, updated_at: now };
    await db.cards.put(updated);
    await enqueue("cards", "update", id, { id, ...patch, updated_at: now });
    return updated;
  }

  const { data, error } = await supabase
    .from("cards")
    .update({ ...patch, updated_at: now })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  await db.cards.put(data);
  return data;
}

export async function deleteCard(id: string): Promise<void> {
  await db.cards.delete(id);

  if (!navigator.onLine) {
    await enqueue("cards", "delete", id, { id });
    return;
  }

  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
}
