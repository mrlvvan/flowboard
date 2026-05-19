import { supabase } from "@/shared/lib/supabase";
import type { Board } from "../types";

export async function fetchBoards(archived = false): Promise<Board[]> {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("is_archived", archived)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createBoard(name: string, ownerId: string): Promise<Board> {
  const { data, error } = await supabase
    .from("boards")
    .insert({ name, owner_id: ownerId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBoard(id: string, patch: { name?: string; is_archived?: boolean }): Promise<Board> {
  const { data, error } = await supabase
    .from("boards")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBoard(id: string): Promise<void> {
  const { error } = await supabase.from("boards").delete().eq("id", id);
  if (error) throw error;
}
