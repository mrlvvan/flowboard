import { useEffect } from "react";

type ShortcutMap = Record<string, () => void>;

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable);

      if (isInput) return;

      const key = [
        e.metaKey && "meta",
        e.ctrlKey && "ctrl",
        e.shiftKey && "shift",
        e.altKey && "alt",
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+");

      shortcuts[key]?.();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
