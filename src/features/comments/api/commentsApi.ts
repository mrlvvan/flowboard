import { supabase } from "@/shared/lib/supabase";
import type { Tables } from "@/shared/lib/database.types";

export type CardComment = Tables<"card_comments">;

export type CommentWithAuthor = CardComment & {
  author: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function fetchComments(cardId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from("card_comments")
    .select(
      `
        *,
        author:profiles!card_comments_author_id_fkey(id, email, full_name, avatar_url)
      `
    )
    .eq("card_id", cardId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as CommentWithAuthor[];
}

// ─── Write ─────────────────────────────────────────────────────────────────────

export async function createComment(input: {
  cardId: string;
  boardId: string;
  authorId: string;
  body: string;
}): Promise<CardComment> {
  const { data, error } = await supabase
    .from("card_comments")
    .insert({
      card_id: input.cardId,
      board_id: input.boardId,
      author_id: input.authorId,
      body: input.body,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateComment(id: string, body: string): Promise<CardComment> {
  const { data, error } = await supabase
    .from("card_comments")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("card_comments").delete().eq("id", id);
  if (error) throw error;
}
