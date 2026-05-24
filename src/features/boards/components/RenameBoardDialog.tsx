import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { I } from "@/shared/ui/icons";
import { useUpdateBoardMutation } from "../api/useBoardsQuery";
import type { Board } from "../types";

const schema = z.object({ name: z.string().min(1, "Required").max(100) });
type FormData = z.infer<typeof schema>;

type Props = {
  board: Board;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RenameBoardDialog({ board, open, onOpenChange }: Props) {
  const mutation = useUpdateBoardMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: board.name },
  });

  useEffect(() => {
    if (open) reset({ name: board.name });
  }, [open, board.name, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await mutation.mutateAsync({ id: board.id, patch: { name: data.name } });
      toast.success("Board renamed");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename board");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] border-0 bg-transparent p-0 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Rename board</DialogTitle>
        </DialogHeader>
        <div
          className="fb-glass-strong fb-ring-inner overflow-hidden rounded-2xl"
          style={{
            boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.12)",
          }}
        >
          <div className="h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500" />
          <div className="px-6 pt-5 pb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-white">Rename board</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              >
                {I.X}
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[11.5px] font-medium tracking-[0.06em] text-white/55 uppercase">
                  Board name
                </span>
                <input
                  type="text"
                  autoFocus
                  {...register("name")}
                  className="fb-input h-10 w-full rounded-xl px-3 text-[14px]"
                />
                {errors.name && (
                  <p className="mt-1 text-[12px] text-rose-400">{errors.name.message}</p>
                )}
              </label>

              <div className="flex gap-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="fb-grad-btn h-9 flex-1 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-9 rounded-xl px-4 text-[13.5px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
