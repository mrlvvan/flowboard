import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Archive, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { RenameBoardDialog } from "./RenameBoardDialog";
import { DeleteBoardDialog } from "./DeleteBoardDialog";
import type { Board } from "../types";

type Props = {
  board: Board;
};

const locales = { en: enUS, ru };

export function BoardCard({ board }: Props) {
  const { t, i18n } = useTranslation("boards");
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const locale = locales[i18n.language as keyof typeof locales] ?? enUS;
  const updatedAt = formatDistanceToNow(new Date(board.updated_at), { addSuffix: true, locale });

  return (
    <>
      <Card className="group relative transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">
              <Link to="/board/$boardId" params={{ boardId: board.id }} className="hover:underline">
                {board.name}
              </Link>
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Board options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("renameBoard")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    /* archive handled inline */
                  }}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {t("archiveBoard")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("deleteBoard")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription>{t("lastUpdated", { date: updatedAt })}</CardDescription>
        </CardHeader>
      </Card>

      <RenameBoardDialog board={board} open={renameOpen} onOpenChange={setRenameOpen} />
      <DeleteBoardDialog board={board} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
