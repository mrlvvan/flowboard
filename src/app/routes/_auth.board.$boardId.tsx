import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/shared/lib/supabase";
import { boardKeys } from "@/features/boards/api/keys";
import { KanbanBoard } from "@/features/columns/components/KanbanBoard";
import { Skeleton } from "@/shared/ui/skeleton";

export const Route = createFileRoute("/_auth/board/$boardId")({
  component: BoardPage,
});

function BoardPage() {
  const { boardId } = Route.useParams();

  const { data: board, isLoading } = useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("id", boardId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-background/80 px-6 py-3 backdrop-blur">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {isLoading ? (
          <Skeleton className="h-5 w-40" />
        ) : (
          <h1 className="text-lg font-semibold">{board?.name ?? "Board"}</h1>
        )}
      </div>

      {/* Board content */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard boardId={boardId} />
      </div>
    </div>
  );
}
