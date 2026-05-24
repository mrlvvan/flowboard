import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { I } from "@/shared/ui/icons";
import { toast } from "sonner";
import { useDeleteBoardMutation } from "../api/useBoardsQuery";
import type { Board } from "../types";

type Props = {
  board: Board;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteBoardDialog({ board, open, onOpenChange }: Props) {
  const mutation = useDeleteBoardMutation();

  const handleDelete = async () => {
    try {
      await mutation.mutateAsync(board.id);
      toast.success("Board deleted");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete board");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] border-0 bg-transparent p-0 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Delete board</DialogTitle>
        </DialogHeader>
        <div
          className="fb-glass-strong fb-ring-inner overflow-hidden rounded-2xl"
          style={{ boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.15)" }}
        >
          <div className="h-[3px] bg-gradient-to-r from-rose-500 via-red-500 to-rose-500" />
          <div className="px-6 pt-5 pb-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-400">
                  {I.Trash}
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-white">Delete board</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                    Are you sure you want to delete{" "}
                    <span className="font-medium text-white/80">&ldquo;{board.name}&rdquo;</span>?
                    This will permanently delete all columns and cards. This action cannot be
                    undone.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              >
                {I.X}
              </button>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => void handleDelete()}
                disabled={mutation.isPending}
                className="h-9 flex-1 rounded-xl bg-rose-500/80 text-[13.5px] font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                {mutation.isPending ? "Deleting…" : "Delete permanently"}
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="h-9 rounded-xl px-4 text-[13.5px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
