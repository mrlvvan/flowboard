import { supabase } from "@/shared/lib/supabase";
import { positionBetween } from "@/shared/lib/position";
import type { Tables } from "@/shared/lib/database.types";

export type Card = Tables<"cards">;

export async function fetchCards(boardId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("board_id", boardId)
    .order("position");

  if (error) throw error;
  return data;
}

export async function createCard(
  boardId: string,
  columnId: string,
  title: string,
  afterPosition?: string
): Promise<Card> {
  const position = positionBetween(afterPosition, undefined);
  const { data, error } = await supabase
    .from("cards")
    .insert({ board_id: boardId, column_id: columnId, title, position })
    .select()
    .single();

  if (error) throw error;
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
  const { data, error } = await supabase
    .from("cards")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
}
