import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { I } from "@/shared/ui/icons";
import { RenameBoardDialog } from "./RenameBoardDialog";
import { DeleteBoardDialog } from "./DeleteBoardDialog";
import { useUpdateBoardMutation } from "../api/useBoardsQuery";
import { toast } from "sonner";
import type { Board } from "../types";

type Props = { board: Board };

const GRADIENTS: [string, string][] = [
  ["#6366f1", "#8b5cf6"],
  ["#ec4899", "#f43f5e"],
  ["#06b6d4", "#3b82f6"],
  ["#10b981", "#22d3ee"],
  ["#f59e0b", "#ef4444"],
  ["#a855f7", "#ec4899"],
  ["#84cc16", "#06b6d4"],
  ["#fb7185", "#fb923c"],
];

/** Pick a deterministic gradient from the board id */
function pickGradient(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length]!;
}

const locales = { en: enUS, ru };

export function BoardCard({ board }: Props) {
  const { t, i18n } = useTranslation("boards");
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const updateMutation = useUpdateBoardMutation();

  const handleArchive = async () => {
    try {
      await updateMutation.mutateAsync({ id: board.id, patch: { is_archived: true } });
      toast.success("Board archived");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive");
    }
  };

  const handleUnarchive = async () => {
    try {
      await updateMutation.mutateAsync({ id: board.id, patch: { is_archived: false } });
      toast.success("Board restored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore");
    }
  };

  const handleToggleStar = async () => {
    try {
      await updateMutation.mutateAsync({ id: board.id, patch: { is_starred: !board.is_starred } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const locale = locales[i18n.language as keyof typeof locales] ?? enUS;
  const updatedAt = formatDistanceToNow(new Date(board.updated_at), {
    addSuffix: true,
    locale,
  });

  const [from, to] = pickGradient(board.id);

  return (
    <>
      <div className="fb-glass fb-lift fb-ring-inner group cursor-pointer overflow-hidden rounded-2xl">
        {/* Top gradient stripe */}
        <div
          className="h-[3px] w-full"
          style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
        />

        <div className="p-4">
          {/* Header row */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {/* Board icon */}
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${from}22, ${to}22)`,
                  boxShadow: `inset 0 0 0 1px ${from}33`,
                }}
              >
                <div
                  className="h-3 w-3 rounded-[3px]"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                />
              </div>
              <div className="min-w-0">
                <Link
                  to="/board/$boardId"
                  params={{ boardId: board.id }}
                  className="block truncate text-[14px] font-semibold text-white/95 transition hover:text-white"
                >
                  {board.name}
                </Link>
                <div className="mt-0.5 text-[11.5px] text-white/40">{updatedAt}</div>
              </div>
            </div>

            {/* Star + Options */}
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  void handleToggleStar();
                }}
                title={board.is_starred ? "Unstar" : "Star board"}
                className={`rounded-md p-1.5 transition ${
                  board.is_starred
                    ? "text-amber-400 opacity-100"
                    : "text-white/35 opacity-0 group-hover:opacity-100 hover:text-amber-400"
                }`}
              >
                {board.is_starred ? I.StarFilled : I.Star}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-md p-1.5 text-white/35 opacity-0 transition group-hover:opacity-100 hover:bg-white/5 hover:text-white">
                    {I.More}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-white/10 bg-[#13131f] text-white"
                >
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-white/[0.05] focus:bg-white/[0.05]"
                    onClick={() => void handleToggleStar()}
                  >
                    {I.Star}&nbsp; {board.is_starred ? "Unstar" : "Star board"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-white/[0.05] focus:bg-white/[0.05]"
                    onClick={() => setRenameOpen(true)}
                  >
                    {I.Edit}&nbsp; {t("renameBoard")}
                  </DropdownMenuItem>
                  {board.is_archived ? (
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-white/[0.05] focus:bg-white/[0.05]"
                      onClick={() => void handleUnarchive()}
                    >
                      {I.Folder}&nbsp; Restore board
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-white/[0.05] focus:bg-white/[0.05]"
                      onClick={() => void handleArchive()}
                    >
                      {I.Folder}&nbsp; Archive board
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="cursor-pointer text-rose-300 focus:bg-rose-500/10 focus:text-rose-200"
                    onClick={() => setDeleteOpen(true)}
                  >
                    {I.Trash}&nbsp; {t("deleteBoard")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mini column preview */}
          <Link to="/board/$boardId" params={{ boardId: board.id }}>
            <div className="mb-4 flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-12 flex-1 flex-col gap-1 rounded-md border border-white/[0.04] bg-white/[0.03] p-1.5"
                >
                  <div
                    className="h-1 rounded-full"
                    style={{
                      background: i === 0 ? `${from}99` : "rgba(255,255,255,0.18)",
                      width: `${40 + ((i * 7) % 40)}%`,
                    }}
                  />
                  <div
                    className="h-1 rounded-full bg-white/[0.08]"
                    style={{ width: `${30 + ((i * 11) % 50)}%` }}
                  />
                  <div
                    className="h-1 rounded-full bg-white/[0.06]"
                    style={{ width: `${50 + ((i * 13) % 30)}%` }}
                  />
                </div>
              ))}
            </div>
          </Link>
        </div>
      </div>

      <RenameBoardDialog board={board} open={renameOpen} onOpenChange={setRenameOpen} />
      <DeleteBoardDialog board={board} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
