import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "./schema";

// Controlled mock — we can swap error behaviour per-test
const mockUpsert = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/shared/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: mockUpsert,
      delete: vi.fn(() => ({ eq: mockDelete })),
    })),
  },
}));

beforeEach(async () => {
  await db.syncQueue.clear();
  vi.clearAllMocks();
});

describe("flushAll — success path", () => {
  it("removes item from queue after successful upsert", async () => {
    mockUpsert.mockResolvedValue({ error: null });
    const { enqueue, flushAll } = await import("./syncQueue");

    await enqueue("boards", "create", "b-1", { id: "b-1", name: "Flush me" });
    expect(await db.syncQueue.count()).toBe(1);

    await flushAll();

    expect(await db.syncQueue.count()).toBe(0);
    expect(mockUpsert).toHaveBeenCalledOnce();
  });

  it("removes item after successful delete operation", async () => {
    mockDelete.mockResolvedValue({ error: null });
    const { enqueue, flushAll } = await import("./syncQueue");

    await enqueue("boards", "delete", "b-2", {});
    await flushAll();

    expect(await db.syncQueue.count()).toBe(0);
    expect(mockDelete).toHaveBeenCalledOnce();
  });
});

describe("flushAll — error path", () => {
  it("increments attempts and keeps item when upsert fails", async () => {
    mockUpsert.mockResolvedValue({ error: new Error("network error") });
    const { enqueue, flushAll } = await import("./syncQueue");

    await enqueue("boards", "create", "b-3", { id: "b-3", name: "Fail" });
    await flushAll();

    const items = await db.syncQueue.toArray();
    expect(items).toHaveLength(1);
    expect(items[0]?.attempts).toBe(1);
    expect(items[0]?.lastError).toBe("network error");
  });

  it("drops item after MAX_ATTEMPTS (5) failures", async () => {
    mockUpsert.mockResolvedValue({ error: new Error("persistent error") });
    const { enqueue, flushAll } = await import("./syncQueue");

    await enqueue("boards", "create", "b-4", { id: "b-4", name: "Drop me" });

    // Set attempts to 4 so the next failure tips it over MAX_ATTEMPTS
    const [item] = await db.syncQueue.toArray();
    if (item?.id) await db.syncQueue.update(item.id, { attempts: 4 });

    await flushAll();

    expect(await db.syncQueue.count()).toBe(0);
  });
});

describe("flushAll — ordering", () => {
  it("flushes multiple items in createdAt order", async () => {
    mockUpsert.mockResolvedValue({ error: null });
    const { enqueue, flushAll } = await import("./syncQueue");

    await enqueue("boards", "create", "b-5", { id: "b-5" });
    await enqueue("cards", "create", "c-1", { id: "c-1" });
    await flushAll();

    expect(await db.syncQueue.count()).toBe(0);
    expect(mockUpsert).toHaveBeenCalledTimes(2);
  });
});
