import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/shared/lib/supabase";
import { boardKeys } from "@/features/boards/api/keys";
import { KanbanBoard } from "@/features/columns/components/KanbanBoard";
import { I } from "@/shared/ui/icons";
import { useBoardChannel } from "@/features/realtime/useBoardChannel";
import { PresenceAvatars } from "@/features/realtime/PresenceAvatars";
import { ShareBoardDialog } from "@/features/realtime/ShareBoardDialog";

export const Route = createFileRoute("/_auth/board/$boardId")({
  component: BoardPage,
});

function BoardPage() {
  const { boardId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const [shareOpen, setShareOpen] = useState(false);

  useBoardChannel(boardId);

  const { data: board, isLoading } = useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: async () => {
      const { data, error } = await supabase.from("boards").select("*").eq("id", boardId).single();
      if (error) throw error;
      return data;
    },
  });

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
            ) : (
              <h1 className="truncate text-[16px] font-semibold tracking-tight">
                {board?.name ?? "Board"}
              </h1>
            )}
            <span className="ml-1 shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-white/45">
              Private
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* Presence avatars */}
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
