import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { I } from "@/shared/ui/icons";
import { useSearch } from "./useSearch";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function SearchDialog({ open, onOpenChange }: Props) {
  const { query, setQuery, results } = useSearch();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  // Focus input when opened; reset state on close — handled via event, not effect
  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setQuery("");
      setActiveIdx(-1);
    }
    onOpenChange(o);
  };

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx < 0) return;
    const item = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const handleSelect = useCallback(
    (id: string, type: "board" | "card", boardId?: string) => {
      handleOpenChange(false);
      if (type === "board") {
        const rawId = id.replace("board:", "");
        void navigate({ to: "/board/$boardId", params: { boardId: rawId } });
      } else if (boardId) {
        void navigate({ to: "/board/$boardId", params: { boardId } });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[activeIdx] ?? results[0];
      if (hit) handleSelect(hit.id, hit.type, hit.boardId);
    } else if (e.key === "Escape") {
      handleOpenChange(false);
    }
  };

  // Reset active index when query changes (call site is the input onChange, not an effect)
  const handleQueryChange = (q: string) => {
    setQuery(q);
    setActiveIdx(-1);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[540px] overflow-hidden border-0 bg-transparent p-0 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div
          className="fb-glass-strong fb-ring-inner overflow-hidden rounded-2xl"
          style={{
            boxShadow:
              "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1), 0 0 60px -20px rgba(139,92,246,0.2)",
          }}
        >
          {/* Search input row */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <span className="shrink-0 text-white/40">{I.Search}</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search boards and cards…"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/30"
            />
            {query && (
              <button
                onClick={() => handleQueryChange("")}
                className="shrink-0 text-white/30 transition hover:text-white/70"
              >
                {I.X}
              </button>
            )}
            <kbd className="shrink-0 rounded border border-white/[0.08] bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-white/40">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[340px] overflow-y-auto py-1.5">
            {results.length === 0 && query.length >= 2 && (
              <p className="px-4 py-8 text-center text-[13px] text-white/35">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
            {results.length === 0 && query.length < 2 && (
              <p className="px-4 py-8 text-center text-[13px] text-white/35">
                Start typing to search boards and cards…
              </p>
            )}
            {results.map((r, idx) => (
              <button
                key={r.id}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-[13px] transition ${
                  idx === activeIdx
                    ? "bg-white/[0.07] text-white"
                    : "text-white/75 hover:bg-white/[0.04] hover:text-white"
                }`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => handleSelect(r.id, r.type, r.boardId)}
              >
                <span className="shrink-0 text-white/40">
                  {r.type === "board" ? I.Grid : I.Edit}
                </span>
                <span className="min-w-0 flex-1 truncate text-left">{r.title}</span>
                <span className="shrink-0 rounded-md border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] text-white/40 capitalize">
                  {r.type}
                </span>
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-3 border-t border-white/[0.05] px-4 py-2 text-[11px] text-white/30">
            <span>↑↓ navigate</span>
            <span className="h-3 w-px bg-white/10" />
            <span>↵ open</span>
            <span className="h-3 w-px bg-white/10" />
            <span>Esc close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
