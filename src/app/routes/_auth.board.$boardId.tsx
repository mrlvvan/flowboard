import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/board/$boardId")({
  component: BoardPage,
});

function BoardPage() {
  const { boardId } = Route.useParams();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b px-6 py-3">
        <h1 className="text-lg font-semibold">Board</h1>
        <span className="text-sm text-muted-foreground">{boardId}</span>
      </div>
      <div className="flex-1 overflow-x-auto p-6">
        <p className="text-muted-foreground">Kanban board coming in Stage 2…</p>
      </div>
    </div>
  );
}
