import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCommandHistory, type Command } from "./commandHistory";

// Mock sonner — the toast calls are side-effects we don't need in tests
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

function makeCmd(value: number, log: number[]): Command {
  return {
    label: `cmd ${value}`,
    execute: () => {
      log.push(value);
    },
    undo: () => {
      log.push(-value);
    },
  };
}

describe("useCommandHistory", () => {
  beforeEach(() => {
    useCommandHistory.getState().clear();
  });

  it("executes a pushed command and stores it in `past`", async () => {
    const log: number[] = [];
    await useCommandHistory.getState().push(makeCmd(1, log));

    expect(log).toEqual([1]);
    expect(useCommandHistory.getState().past).toHaveLength(1);
    expect(useCommandHistory.getState().future).toHaveLength(0);
  });

  it("undo() reverses the last command and moves it to `future`", async () => {
    const log: number[] = [];
    await useCommandHistory.getState().push(makeCmd(1, log));
    await useCommandHistory.getState().push(makeCmd(2, log));

    await useCommandHistory.getState().undo();

    expect(log).toEqual([1, 2, -2]);
    expect(useCommandHistory.getState().past).toHaveLength(1);
    expect(useCommandHistory.getState().future).toHaveLength(1);
  });

  it("redo() re-applies the last undone command", async () => {
    const log: number[] = [];
    await useCommandHistory.getState().push(makeCmd(1, log));
    await useCommandHistory.getState().undo();
    await useCommandHistory.getState().redo();

    expect(log).toEqual([1, -1, 1]);
    expect(useCommandHistory.getState().past).toHaveLength(1);
    expect(useCommandHistory.getState().future).toHaveLength(0);
  });

  it("push() clears the redo stack", async () => {
    const log: number[] = [];
    await useCommandHistory.getState().push(makeCmd(1, log));
    await useCommandHistory.getState().undo();
    expect(useCommandHistory.getState().future).toHaveLength(1);

    await useCommandHistory.getState().push(makeCmd(2, log));
    expect(useCommandHistory.getState().future).toHaveLength(0);
  });

  it("undo() is a no-op on empty `past`", async () => {
    await useCommandHistory.getState().undo();
    expect(useCommandHistory.getState().past).toHaveLength(0);
  });

  it("redo() prefers `redo` callback when provided", async () => {
    const order: string[] = [];
    const cmd: Command = {
      label: "test",
      execute: () => {
        order.push("execute");
      },
      undo: () => {
        order.push("undo");
      },
      redo: () => {
        order.push("redo");
      },
    };

    await useCommandHistory.getState().push(cmd);
    await useCommandHistory.getState().undo();
    await useCommandHistory.getState().redo();

    expect(order).toEqual(["execute", "undo", "redo"]);
  });

  it("caps history at MAX_HISTORY entries", async () => {
    const log: number[] = [];
    for (let i = 0; i < 60; i++) {
      await useCommandHistory.getState().push(makeCmd(i, log));
    }
    expect(useCommandHistory.getState().past).toHaveLength(50);
    // Earliest preserved entry should be the 11th push (0-indexed: 10)
    expect(useCommandHistory.getState().past[0]?.label).toBe("cmd 10");
  });
});
