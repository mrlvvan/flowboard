import { db } from "./schema";
import { flushAll } from "./syncQueue";
import { supabase } from "@/shared/lib/supabase";

/** Pull latest data from Supabase into Dexie (last-write-wins by updated_at) */
export async function pullBoards(): Promise<void> {
  const { data, error } = await supabase.from("boards").select("*").order("updated_at");
  if (error || !data) return;

  for (const remote of data) {
    const local = await db.boards.get(remote.id);
    if (!local || local.updated_at <= remote.updated_at) {
      await db.boards.put(remote);
    }
  }
}

export async function pullColumnsAndCards(boardId: string): Promise<void> {
  const [colRes, cardRes] = await Promise.all([
    supabase.from("columns").select("*").eq("board_id", boardId).order("position"),
    supabase.from("cards").select("*").eq("board_id", boardId).order("position"),
  ]);

  if (colRes.data) {
    for (const remote of colRes.data) {
      const local = await db.columns.get(remote.id);
      if (!local || local.updated_at <= remote.updated_at) {
        await db.columns.put(remote);
      }
    }
  }

  if (cardRes.data) {
    for (const remote of cardRes.data) {
      const local = await db.cards.get(remote.id);
      if (!local || local.updated_at <= remote.updated_at) {
        await db.cards.put(remote);
      }
    }
  }
}

export async function goOnline(): Promise<void> {
  await flushAll();
  await pullBoards();
}
