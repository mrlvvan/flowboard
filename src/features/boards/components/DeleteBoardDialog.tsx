import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { useDeleteBoardMutation } from "../api/useBoardsQuery";
import type { Board } from "../types";

type Props = {
  board: Board;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteBoardDialog({ board, open, onOpenChange }: Props) {
  const { t } = useTranslation("boards");
  const { t: tc } = useTranslation("common");
  const mutation = useDeleteBoardMutation();

  const handleDelete = async () => {
    await mutation.mutateAsync(board.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteBoard")}</DialogTitle>
          <DialogDescription>
            {t("deleteBoardConfirm", { name: board.name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={mutation.isPending}
          >
            {tc("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
