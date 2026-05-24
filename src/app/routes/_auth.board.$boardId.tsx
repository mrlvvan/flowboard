import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/shared/lib/supabase";
import { boardKeys } from "@/features/boards/api/keys";
import { KanbanBoard } from "@/features/columns/components/KanbanBoard";
import { I } from "@/shared/ui/icons";
import { useBoardChannel } from "@/features/realtime/useBoardChannel";
import { PresenceAvatars } from "@/features/realtime/PresenceAvatars";
import { ShareBoardDialog } from "@/features/realtime/ShareBoardDialog";
import { pullColumnsAndCards } from "@/db/syncEngine";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/board/$boardId")({
  component: BoardPage,
});

function BoardPage() {
  const { boardId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const startEditingName = () => {
    setNameInput(board?.name ?? "");
    setEditingName(true);
  };

  useBoardChannel(boardId);

  // Pull columns + cards into Dexie on mount so search works
  useEffect(() => {
    void pullColumnsAndCards(boardId);
  }, [boardId]);

  const { data: board, isLoading } = useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: async () => {
      const { data, error } = await supabase.from("boards").select("*").eq("id", boardId).single();
      if (error) throw error;
      return data;
    },
  });

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("boards")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", boardId);
      if (error) throw error;
      return name;
    },
    onSuccess: (name) => {
      void qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
      void qc.invalidateQueries({ queryKey: boardKeys.lists() });
      toast.success(`Renamed to "${name}"`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to rename");
    },
  });

  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  const saveName = () => {
    const trimmed = nameInput.trim();
    setEditingName(false);
    if (trimmed && trimmed !== board?.name) {
      void renameMutation.mutateAsync(trimmed);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden text-white">
      {/* Board header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.04] px-7">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/55 transition hover:bg-white/[0.06] hover:text-white"
          >
            {I.Back}
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            {/* Board icon */}
            <div
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, #6366f122, #8b5cf622)",
                boxShadow: "inset 0 0 0 1px #6366f155",
              }}
            >
              <div
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              />
            </div>

            {isLoading ? (
              <div className="h-5 w-40 animate-pulse rounded-md bg-white/[0.06]" />
            ) : editingName ? (
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="w-48 border-b border-violet-400/60 bg-transparent pb-0.5 text-[16px] font-semibold tracking-tight text-white outline-none"
              />
            ) : (
              <button
                onClick={startEditingName}
                title="Click to rename"
                className="group flex items-center gap-1.5 truncate text-[16px] font-semibold tracking-tight text-white transition hover:text-white/80"
              >
                {board?.name ?? "Board"}
                <span className="opacity-0 transition group-hover:opacity-40">{I.Edit}</span>
              </button>
            )}

            <span className="ml-1 shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-white/45">
              Private
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <PresenceAvatars boardId={boardId} currentUser={user} />
          <div className="h-6 w-px bg-white/[0.06]" />
          <button className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] text-white/65 transition hover:bg-white/[0.05] hover:text-white">
            {I.Filter} Filter
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] text-white/65 transition hover:bg-white/[0.05] hover:text-white">
            {I.Eye} View
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="fb-grad-btn flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-white"
          >
            {I.Share} Share
          </button>
        </div>
      </header>

      {/* Kanban columns */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard boardId={boardId} />
      </div>

      {board && (
        <ShareBoardDialog
          boardId={boardId}
          boardName={board.name}
          open={shareOpen}
          onOpenChange={setShareOpen}
        />
      )}
    </div>
  );
}
