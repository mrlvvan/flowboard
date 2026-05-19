import { supabase } from "@/shared/lib/supabase";
import { positionBetween } from "@/shared/lib/position";
import type { Tables } from "@/shared/lib/database.types";

export type Column = Tables<"columns">;

export async function fetchColumns(boardId: string): Promise<Column[]> {
  const { data, error } = await supabase
    .from("columns")
    .select("*")
    .eq("board_id", boardId)
    .order("position");

  if (error) throw error;
  return data;
}

export async function createColumn(boardId: string, name: string, afterPosition?: string): Promise<Column> {
  const position = positionBetween(afterPosition, undefined);
  const { data, error } = await supabase
    .from("columns")
    .insert({ board_id: boardId, name, position })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateColumn(id: string, patch: { name?: string; position?: string }): Promise<Column> {
  const { data, error } = await supabase
    .from("columns")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteColumn(id: string): Promise<void> {
  const { error } = await supabase.from("columns").delete().eq("id", id);
  if (error) throw error;
}
