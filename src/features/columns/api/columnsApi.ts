import { supabase } from "@/shared/lib/supabase";
import { positionBetween } from "@/shared/lib/position";
import { isNetworkError } from "@/shared/lib/networkError";
import { db } from "@/db/schema";
import { enqueue } from "@/db/syncQueue";
import type { Tables } from "@/shared/lib/database.types";

export type Column = Tables<"columns">;

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function fetchColumns(boardId: string): Promise<Column[]> {
  try {
    const { data, error } = await supabase
      .from("columns")
      .select("*")
      .eq("board_id", boardId)
      .order("position");

    if (error) throw error;

    await db.columns.bulkPut(data);
    return data;
  } catch (err) {
    if (isNetworkError(err)) {
      const local = await db.columns.where("board_id").equals(boardId).toArray();
      return local.sort((a, b) => a.position.localeCompare(b.position));
    }
    throw err;
  }
}

// ─── Write ─────────────────────────────────────────────────────────────────────

export async function createColumn(
  boardId: string,
  name: string,
  afterPosition?: string
): Promise<Column> {
  const position = positionBetween(afterPosition, undefined);
  const now = new Date().toISOString();

  if (!navigator.onLine) {
    const id = crypto.randomUUID();
    const column: Column = {
      id,
      board_id: boardId,
      name,
      position,
      created_at: now,
      updated_at: now,
    };
    await db.columns.put(column);
    await enqueue("columns", "create", id, column);
    return column;
  }

  const { data, error } = await supabase
    .from("columns")
    .insert({ board_id: boardId, name, position })
    .select()
    .single();

  if (error) throw error;
  await db.columns.put(data);
  return data;
}

export async function updateColumn(
  id: string,
  patch: { name?: string; position?: string }
): Promise<Column> {
  const now = new Date().toISOString();

  if (!navigator.onLine) {
    const existing = await db.columns.get(id);
    if (!existing) throw new Error("Column not found locally");
    const updated: Column = { ...existing, ...patch, updated_at: now };
    await db.columns.put(updated);
    await enqueue("columns", "update", id, { id, ...patch, updated_at: now });
    return updated;
  }

  const { data, error } = await supabase
    .from("columns")
    .update({ ...patch, updated_at: now })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  await db.columns.put(data);
  return data;
}

export async function deleteColumn(id: string): Promise<void> {
  await db.columns.delete(id);

  if (!navigator.onLine) {
    await enqueue("columns", "delete", id, { id });
    return;
  }

  const { error } = await supabase.from("columns").delete().eq("id", id);
  if (error) throw error;
}
