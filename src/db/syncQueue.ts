import { db, type SyncOperation, type SyncQueueItem, type SyncTable } from "./schema";
import { supabase } from "@/shared/lib/supabase";

export async function enqueue(
  table: SyncTable,
  operation: SyncOperation,
  recordId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const existing = await db.syncQueue
    .where({ table, recordId })
    .filter((item) => item.operation !== "delete")
    .first();

  if (existing?.id && operation === "update") {
    await db.syncQueue.update(existing.id, {
      payload: { ...existing.payload, ...payload },
      attempts: 0,
    });
    return;
  }

  await db.syncQueue.add({ table, operation, recordId, payload, createdAt: Date.now(), attempts: 0 });
}

const MAX_ATTEMPTS = 5;

function backoffMs(attempts: number): number {
  return Math.min(1000 * 2 ** attempts, 30_000);
}

async function flushItem(item: SyncQueueItem & { id: number }): Promise<void> {
  try {
    if (item.operation === "create" || item.operation === "update") {
      // Dynamic table upsert — typed via generic helper
      const { error } = await supabaseUpsert(item.table, item.payload);
      if (error) throw error;
    } else if (item.operation === "delete") {
      const { error } = await supabase.from(item.table).delete().eq("id", item.recordId);
      if (error) throw error;
    }
    await db.syncQueue.delete(item.id);
  } catch (err) {
    const attempts = item.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await db.syncQueue.delete(item.id);
      console.error("[SyncQueue] Dropping after max attempts:", item, err);
      return;
    }
    await db.syncQueue.update(item.id, {
      attempts,
      lastError: err instanceof Error ? err.message : String(err),
    });
    setTimeout(() => void flushOne(item.id), backoffMs(attempts));
  }
}

// Supabase upsert with explicit table branches to preserve type safety
function supabaseUpsert(table: SyncTable, payload: Record<string, unknown>) {
  if (table === "boards") return supabase.from("boards").upsert(payload as never);
  if (table === "columns") return supabase.from("columns").upsert(payload as never);
  return supabase.from("cards").upsert(payload as never);
}

async function flushOne(id: number): Promise<void> {
  const item = await db.syncQueue.get(id);
  if (item?.id) await flushItem(item as SyncQueueItem & { id: number });
}

export async function flushAll(): Promise<void> {
  const items = await db.syncQueue.orderBy("createdAt").toArray();
  for (const item of items) {
    if (item.id) await flushItem(item as SyncQueueItem & { id: number });
  }
}

export async function pendingCount(): Promise<number> {
  return db.syncQueue.count();
}
