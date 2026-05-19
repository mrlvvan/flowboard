import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { BoardsGrid, CreateBoardDialog } from "@/features/boards";

export const Route = createFileRoute("/_auth/")({
  component: BoardsPage,
});

function BoardsPage() {
  const { t } = useTranslation("boards");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("newBoard")}
        </Button>
      </div>

      <BoardsGrid />

      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
