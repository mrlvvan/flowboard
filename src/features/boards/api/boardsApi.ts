import { supabase } from "@/shared/lib/supabase";
import { isNetworkError } from "@/shared/lib/networkError";
import { db } from "@/db/schema";
import { enqueue } from "@/db/syncQueue";
import type { Board } from "../types";

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function fetchBoards(archived = false): Promise<Board[]> {
  try {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("is_archived", archived)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Write-through to Dexie
    await db.boards.bulkPut(data);
    return data;
  } catch (err) {
    if (isNetworkError(err)) {
      const local = await db.boards
        .where("is_archived")
        .equals(archived ? 1 : 0)
        .toArray();
      return local.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    throw err;
  }
}

// ─── Write ─────────────────────────────────────────────────────────────────────

export async function createBoard(name: string, ownerId: string): Promise<Board> {
  const now = new Date().toISOString();

  if (!navigator.onLine) {
    const id = crypto.randomUUID();
    const board: Board = {
      id,
      name,
      owner_id: ownerId,
      is_archived: false,
      is_starred: false,
      created_at: now,
      updated_at: now,
    };
    await db.boards.put(board);
    await enqueue("boards", "create", id, board);
    return board;
  }

  const { data, error } = await supabase
    .from("boards")
    .insert({ name, owner_id: ownerId })
    .select()
    .single();

  if (error) throw error;
  await db.boards.put(data);
  return data;
}

export async function updateBoard(
  id: string,
  patch: { name?: string; is_archived?: boolean; is_starred?: boolean }
): Promise<Board> {
  const now = new Date().toISOString();

  if (!navigator.onLine) {
    const existing = await db.boards.get(id);
    if (!existing) throw new Error("Board not found locally");
    const updated: Board = { ...existing, ...patch, updated_at: now };
    await db.boards.put(updated);
    await enqueue("boards", "update", id, { id, ...patch, updated_at: now });
    return updated;
  }

  const { data, error } = await supabase
    .from("boards")
    .update({ ...patch, updated_at: now })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  await db.boards.put(data);
  return data;
}

export async function deleteBoard(id: string): Promise<void> {
  await db.boards.delete(id);

  if (!navigator.onLine) {
    await enqueue("boards", "delete", id, { id });
    return;
  }

  const { error } = await supabase.from("boards").delete().eq("id", id);
  if (error) throw error;
}
