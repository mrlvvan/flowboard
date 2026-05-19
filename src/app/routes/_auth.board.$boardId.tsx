import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/shared/lib/supabase";
import { boardKeys } from "@/features/boards/api/keys";
import { KanbanBoard } from "@/features/columns/components/KanbanBoard";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
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

  // Subscribe to realtime updates
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="bg-background/80 flex items-center gap-3 border-b px-6 py-3 backdrop-blur">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {isLoading ? (
          <Skeleton className="h-5 w-40" />
        ) : (
          <h1 className="text-lg font-semibold">{board?.name ?? "Board"}</h1>
        )}

        <div className="ml-auto flex items-center gap-3">
          <PresenceAvatars boardId={boardId} currentUser={user} />
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 className="mr-2 h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </div>

      {/* Kanban */}
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
