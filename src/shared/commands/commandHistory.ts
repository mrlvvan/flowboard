import { create } from "zustand";
import { toast } from "sonner";

/**
 * A single reversible operation.  `execute` runs the action; `undo` reverses it.
 * `redo` defaults to running `execute` again — override if redo needs a different code path.
 */
export type Command = {
  /** Human-readable label shown in toasts (e.g. "Delete card") */
  label: string;
  /** Perform the action */
  execute: () => Promise<void> | void;
  /** Reverse it */
  undo: () => Promise<void> | void;
  /** Re-apply.  Defaults to `execute` */
  redo?: () => Promise<void> | void;
};

const MAX_HISTORY = 50;

type Store = {
  past: Command[];
  future: Command[];
  /** Run a command and push it onto the history.  Clears redo stack. */
  push: (cmd: Command) => Promise<void>;
  /** Pop from `past`, run `undo`, push onto `future` */
  undo: () => Promise<void>;
  /** Pop from `future`, run `redo`/`execute`, push back onto `past` */
  redo: () => Promise<void>;
  /** Wipe history — useful when switching boards */
  clear: () => void;
};

export const useCommandHistory = create<Store>((set, get) => ({
  past: [],
  future: [],

  push: async (cmd) => {
    await cmd.execute();
    set((s) => ({
      past: [...s.past, cmd].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  undo: async () => {
    const { past } = get();
    const cmd = past[past.length - 1];
    if (!cmd) return;
    try {
      await cmd.undo();
      set((s) => ({
        past: s.past.slice(0, -1),
        future: [cmd, ...s.future].slice(0, MAX_HISTORY),
      }));
      toast(`Undid: ${cmd.label}`, {
        action: { label: "Redo", onClick: () => void get().redo() },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Undo failed");
    }
  },

  redo: async () => {
    const { future } = get();
    const cmd = future[0];
    if (!cmd) return;
    try {
      await (cmd.redo ?? cmd.execute)();
      set((s) => ({
        past: [...s.past, cmd].slice(-MAX_HISTORY),
        future: s.future.slice(1),
      }));
      toast(`Redid: ${cmd.label}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Redo failed");
    }
  },

  clear: () => set({ past: [], future: [] }),
}));
