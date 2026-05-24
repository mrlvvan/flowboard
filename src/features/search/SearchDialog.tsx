import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { I } from "@/shared/ui/icons";
import { useSearch } from "./useSearch";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function SearchDialog({ open, onOpenChange }: Props) {
  const { query, setQuery, results } = useSearch();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [open, setQuery]);

  const handleSelect = (id: string, type: "board" | "card", boardId?: string) => {
    onOpenChange(false);
    if (type === "board") {
      const rawId = id.replace("board:", "");
      void navigate({ to: "/board/$boardId", params: { boardId: rawId } });
    } else if (boardId) {
      void navigate({ to: "/board/$boardId", params: { boardId } });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search boards and cards…"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/30"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
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
          <div className="max-h-[340px] overflow-y-auto py-1.5">
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
            {results.map((r) => (
              <button
                key={r.id}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] transition hover:bg-white/[0.04]"
                onClick={() => handleSelect(r.id, r.type, r.boardId)}
              >
                <span className="shrink-0 text-white/40">
                  {r.type === "board" ? I.Grid : I.Edit}
                </span>
                <span className="min-w-0 flex-1 truncate text-left text-white/85">{r.title}</span>
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
