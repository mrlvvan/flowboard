/**
 * Unit tests for the offline path in cardsApi.
 *
 * When navigator.onLine === false, mutations must:
 *   1. Write the record into Dexie immediately (UI stays responsive)
 *   2. Enqueue the operation in syncQueue (persisted across page refreshes)
 *   3. NOT call Supabase at all
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { db } from "@/db/schema";

// ── Supabase mock — should never be called in offline tests ──────────────────
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/shared/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockInsert })) })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ select: vi.fn(() => ({ single: mockUpdate })) })),
      })),
      delete: vi.fn(() => ({ eq: mockDelete })),
    })),
  },
}));

// ── Put navigator offline / online ───────────────────────────────────────────
function setOnline(online: boolean) {
  Object.defineProperty(navigator, "onLine", { value: online, writable: true, configurable: true });
}

beforeEach(async () => {
  await db.syncQueue.clear();
  await db.cards.clear();
  vi.clearAllMocks();
  setOnline(false); // default to offline for this suite
});

afterEach(() => {
  setOnline(true); // restore
});

// ── createCard ────────────────────────────────────────────────────────────────

describe("createCard — offline", () => {
  it("returns a card with a local UUID without hitting Supabase", async () => {
    const { createCard } = await import("./cardsApi");
    const card = await createCard("board-1", "col-1", "Offline card");

    expect(card.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(card.title).toBe("Offline card");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("persists the card in Dexie", async () => {
    const { createCard } = await import("./cardsApi");
    const card = await createCard("board-1", "col-1", "Persisted offline");

    const local = await db.cards.get(card.id);
    expect(local).toBeDefined();
    expect(local?.title).toBe("Persisted offline");
  });

  it("enqueues a 'create' operation in syncQueue", async () => {
    const { createCard } = await import("./cardsApi");
    const card = await createCard("board-1", "col-1", "Queued card");

    const queue = await db.syncQueue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.operation).toBe("create");
    expect(queue[0]?.table).toBe("cards");
    expect(queue[0]?.recordId).toBe(card.id);
  });
});

// ── updateCard ────────────────────────────────────────────────────────────────

describe("updateCard — offline", () => {
  it("updates Dexie and enqueues without calling Supabase", async () => {
    // Seed a local card first
    const existing = {
      id: "card-offline-1",
      board_id: "board-1",
      column_id: "col-1",
      title: "Original",
      description: null,
      due_date: null,
      labels: [] as string[],
      position: "a",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.cards.put(existing);

    const { updateCard } = await import("./cardsApi");
    const updated = await updateCard("card-offline-1", { title: "Updated offline" });

    expect(updated.title).toBe("Updated offline");
    expect(mockUpdate).not.toHaveBeenCalled();

    const local = await db.cards.get("card-offline-1");
    expect(local?.title).toBe("Updated offline");

    const queue = await db.syncQueue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.operation).toBe("update");
  });

  it("merges two consecutive offline updates into one queue entry", async () => {
    await db.cards.put({
      id: "card-offline-2",
      board_id: "b",
      column_id: "c",
      title: "A",
      description: null,
      due_date: null,
      labels: [] as string[],
      position: "a",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const { updateCard } = await import("./cardsApi");
    await updateCard("card-offline-2", { title: "B" });
    await updateCard("card-offline-2", { title: "C" });

    const queue = await db.syncQueue.toArray();
    // syncQueue merges consecutive updates for same recordId
    expect(queue).toHaveLength(1);
    expect((queue[0]?.payload as { title: string }).title).toBe("C");
  });
});

// ── deleteCard ────────────────────────────────────────────────────────────────

describe("deleteCard — offline", () => {
  it("removes from Dexie and enqueues delete without calling Supabase", async () => {
    await db.cards.put({
      id: "card-del-1",
      board_id: "b",
      column_id: "c",
      title: "To delete",
      description: null,
      due_date: null,
      labels: [] as string[],
      position: "a",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const { deleteCard } = await import("./cardsApi");
    await deleteCard("card-del-1");

    expect(await db.cards.get("card-del-1")).toBeUndefined();
    expect(mockDelete).not.toHaveBeenCalled();

    const queue = await db.syncQueue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.operation).toBe("delete");
    expect(queue[0]?.recordId).toBe("card-del-1");
  });
});
