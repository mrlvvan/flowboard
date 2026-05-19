import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "./schema";

// Mock supabase so tests don't need a real connection
vi.mock("@/shared/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    })),
  },
}));

// Use in-memory Dexie (fake-indexeddb is auto-used by Dexie in test env)
beforeEach(async () => {
  await db.syncQueue.clear();
});

describe("syncQueue enqueue", () => {
  it("adds a create operation", async () => {
    const { enqueue } = await import("./syncQueue");
    await enqueue("boards", "create", "board-1", { id: "board-1", name: "Test" });
    const items = await db.syncQueue.toArray();
    expect(items).toHaveLength(1);
    expect(items[0]?.operation).toBe("create");
    expect(items[0]?.recordId).toBe("board-1");
  });

  it("merges consecutive update operations for the same record", async () => {
    const { enqueue } = await import("./syncQueue");
    await enqueue("boards", "update", "board-1", { name: "First" });
    await enqueue("boards", "update", "board-1", { name: "Second" });
    const items = await db.syncQueue.toArray();
    expect(items).toHaveLength(1);
    expect((items[0]?.payload as { name: string }).name).toBe("Second");
  });

  it("does not merge create + delete for same record", async () => {
    const { enqueue } = await import("./syncQueue");
    await enqueue("boards", "create", "board-2", { id: "board-2", name: "A" });
    await enqueue("boards", "delete", "board-2", {});
    const items = await db.syncQueue.toArray();
    expect(items).toHaveLength(2);
  });
});

describe("pendingCount", () => {
  it("returns 0 for empty queue", async () => {
    const { pendingCount } = await import("./syncQueue");
    expect(await pendingCount()).toBe(0);
  });

  it("returns correct count after enqueue", async () => {
    const { enqueue, pendingCount } = await import("./syncQueue");
    await enqueue("cards", "create", "c-1", { id: "c-1" });
    await enqueue("cards", "create", "c-2", { id: "c-2" });
    expect(await pendingCount()).toBe(2);
  });
});
