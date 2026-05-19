import { useTranslation } from "react-i18next";
import { LayoutGrid } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { BoardCard } from "./BoardCard";
import { useBoardsQuery } from "../api/useBoardsQuery";

export function BoardsGrid() {
  const { t } = useTranslation("boards");
  const { data: boards, isLoading, isError, refetch } = useBoardsQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <p>{t("common:error")}</p>
        <button onClick={() => void refetch()} className="text-sm underline">
          {t("common:retry")}
        </button>
      </div>
    );
  }

  if (!boards?.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <LayoutGrid className="h-12 w-12 opacity-30" />
        <p className="text-lg font-medium">{t("empty")}</p>
        <p className="text-sm">{t("emptySubtitle")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} />
      ))}
    </div>
  );
}
