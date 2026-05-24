/**
 * Unit tests for the offline path in columnsApi.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { db } from "@/db/schema";

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

function setOnline(online: boolean) {
  Object.defineProperty(navigator, "onLine", { value: online, writable: true, configurable: true });
}

beforeEach(async () => {
  await db.syncQueue.clear();
  await db.columns.clear();
  vi.clearAllMocks();
  setOnline(false);
});

afterEach(() => setOnline(true));

describe("createColumn — offline", () => {
  it("creates column locally without hitting Supabase", async () => {
    const { createColumn } = await import("./columnsApi");
    const col = await createColumn("board-1", "In Progress");

    expect(col.name).toBe("In Progress");
    expect(col.board_id).toBe("board-1");
    expect(mockInsert).not.toHaveBeenCalled();

    const local = await db.columns.get(col.id);
    expect(local?.name).toBe("In Progress");
  });

  it("enqueues a 'create' operation", async () => {
    const { createColumn } = await import("./columnsApi");
    const col = await createColumn("board-1", "Done");

    const queue = await db.syncQueue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.operation).toBe("create");
    expect(queue[0]?.table).toBe("columns");
    expect(queue[0]?.recordId).toBe(col.id);
  });
});

describe("updateColumn — offline", () => {
  it("renames column locally and enqueues", async () => {
    await db.columns.put({
      id: "col-1",
      board_id: "board-1",
      name: "Todo",
      position: "a",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const { updateColumn } = await import("./columnsApi");
    const updated = await updateColumn("col-1", { name: "Backlog" });

    expect(updated.name).toBe("Backlog");
    expect(mockUpdate).not.toHaveBeenCalled();

    const queue = await db.syncQueue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.operation).toBe("update");
  });
});

describe("deleteColumn — offline", () => {
  it("removes from Dexie and enqueues", async () => {
    await db.columns.put({
      id: "col-del-1",
      board_id: "b",
      name: "Temp",
      position: "a",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const { deleteColumn } = await import("./columnsApi");
    await deleteColumn("col-del-1");

    expect(await db.columns.get("col-del-1")).toBeUndefined();
    expect(mockDelete).not.toHaveBeenCalled();

    const queue = await db.syncQueue.toArray();
    expect(queue[0]?.operation).toBe("delete");
  });
});
