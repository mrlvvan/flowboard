import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, LayoutDashboard, StickyNote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
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
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-3">
          <Search className="text-muted-foreground mr-2 h-4 w-4 shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search boards and cards…"
            className="h-12 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 && query.length >= 2 && (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {results.length === 0 && query.length < 2 && (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">
              Start typing to search…
            </p>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              className="hover:bg-accent flex w-full items-center gap-3 px-4 py-2 text-sm"
              onClick={() => handleSelect(r.id, r.type, r.boardId)}
            >
              {r.type === "board" ? (
                <LayoutDashboard className="text-muted-foreground h-4 w-4" />
              ) : (
                <StickyNote className="text-muted-foreground h-4 w-4" />
              )}
              <span>{r.title}</span>
              <span className="text-muted-foreground ml-auto text-xs capitalize">{r.type}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
