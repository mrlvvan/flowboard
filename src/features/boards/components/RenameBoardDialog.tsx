import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useUpdateBoardMutation } from "../api/useBoardsQuery";
import type { Board } from "../types";

const schema = z.object({ name: z.string().min(1).max(100) });
type FormData = z.infer<typeof schema>;

type Props = {
  board: Board;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RenameBoardDialog({ board, open, onOpenChange }: Props) {
  const { t } = useTranslation("boards");
  const { t: tc } = useTranslation("common");
  const mutation = useUpdateBoardMutation();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: board.name },
  });

  useEffect(() => {
    if (open) reset({ name: board.name });
  }, [open, board.name, reset]);

  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync({ id: board.id, patch: { name: data.name } });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("renameBoard")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="board-name">{t("boardName")}</Label>
            <Input
              id="board-name"
              {...register("name")}
              placeholder={t("boardNamePlaceholder")}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
