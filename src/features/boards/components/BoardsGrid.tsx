import { useTranslation } from "react-i18next";
import { I } from "@/shared/ui/icons";
import { BoardCard } from "./BoardCard";
import { useBoardsQuery } from "../api/useBoardsQuery";

type Props = {
  onCreateBoard: () => void;
};

export function BoardsGrid({ onCreateBoard }: Props) {
  const { t } = useTranslation("boards");
  const { data: boards, isLoading, isError, refetch } = useBoardsQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Ghost "new board" card */}
        <GhostCard onCreateBoard={onCreateBoard} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="fb-glass h-[190px] animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-white/50">
        <p>Failed to load boards.</p>
        <button
          onClick={() => void refetch()}
          className="text-sm text-violet-300 underline hover:text-violet-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!boards?.length) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GhostCard onCreateBoard={onCreateBoard} />
        <div className="col-span-full flex flex-col items-center gap-3 py-16 text-white/40">
          <div className="text-[40px] opacity-30">{I.Grid}</div>
          <p className="text-[16px] font-medium text-white/60">{t("empty")}</p>
          <p className="text-[13.5px]">{t("emptySubtitle")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <GhostCard onCreateBoard={onCreateBoard} />
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} />
      ))}
    </div>
  );
}

function GhostCard({ onCreateBoard }: { onCreateBoard: () => void }) {
  return (
    <button
      onClick={onCreateBoard}
      className="group grid min-h-[190px] place-items-center rounded-2xl border border-dashed border-white/[0.1] transition-all hover:border-violet-400/40 hover:bg-white/[0.02]"
    >
      <div className="text-center">
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white/60 transition group-hover:border-violet-400/40 group-hover:text-violet-300">
          {I.Plus}
        </div>
        <div className="mt-2.5 text-[13px] font-medium text-white/55 group-hover:text-white">
          Create new board
        </div>
        <div className="mt-0.5 text-[11px] text-white/35">or import from Trello</div>
      </div>
    </button>
  );
}
