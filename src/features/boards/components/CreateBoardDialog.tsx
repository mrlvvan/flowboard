import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { I } from "@/shared/ui/icons";
import { useCreateBoardMutation } from "../api/useBoardsQuery";
import { useAuth } from "@/features/auth";

const schema = z.object({ name: z.string().min(1, "Name is required").max(100) });
type FormData = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Gradient presets for board colour picker
const GRADIENTS = [
  ["#6366f1", "#8b5cf6"],
  ["#3b82f6", "#06b6d4"],
  ["#10b981", "#06b6d4"],
  ["#f59e0b", "#f97316"],
  ["#ec4899", "#a855f7"],
  ["#f43f5e", "#f97316"],
  ["#64748b", "#94a3b8"],
  ["#8b5cf6", "#ec4899"],
] as const;

export function CreateBoardDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const mutation = useCreateBoardMutation();

  const [previewName, setPreviewName] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  const name = previewName;

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error("You must be signed in to create a board");
      return;
    }
    try {
      await mutation.mutateAsync({ name: data.name, ownerId: user.id });
      toast.success(`Board "${data.name}" created`);
      reset();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // Give actionable hints for common Supabase errors
      if (msg.includes("relation") && msg.includes("does not exist")) {
        toast.error("Database tables not found. Run the migration in Supabase SQL Editor first.", {
          duration: 8000,
        });
      } else if (msg.includes("violates foreign key")) {
        toast.error("Your profile is missing. Run the migration SQL to backfill profiles.", {
          duration: 8000,
        });
      } else if (msg.includes("new row violates row-level security")) {
        toast.error("Permission denied. Check Supabase RLS policies.", { duration: 6000 });
      } else {
        toast.error(msg || "Failed to create board");
      }
    }
  };

  const handleClose = () => {
    reset();
    setPreviewName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[440px] overflow-hidden border-0 bg-transparent p-0 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Create board</DialogTitle>
        </DialogHeader>

        <div
          className="fb-glass-strong fb-ring-inner overflow-hidden rounded-2xl"
          style={{
            boxShadow:
              "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.12), 0 0 60px -20px rgba(139,92,246,0.2)",
          }}
        >
          {/* Top gradient line */}
          <div className="h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <h2 className="text-[17px] font-semibold tracking-tight text-white">Create board</h2>
            <button
              onClick={handleClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white"
            >
              {I.X}
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6">
            {/* Preview strip */}
            <div
              className="mb-5 flex h-24 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #6366f122, #8b5cf622)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <div className="text-center">
                <div
                  className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl text-[15px] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  {name ? name[0]?.toUpperCase() : I.Grid}
                </div>
                <p className="text-[13px] font-medium text-white/70">{name || "Board name"}</p>
              </div>
            </div>

            {/* Name field */}
            <label className="mb-4 block">
              <span className="mb-1.5 block text-[12px] font-medium tracking-[0.06em] text-white/55 uppercase">
                Board name *
              </span>
              <input
                type="text"
                placeholder="e.g. Product Roadmap"
                autoFocus
                {...register("name")}
                onChange={(e) => {
                  void register("name").onChange(e);
                  setPreviewName(e.target.value);
                }}
                className="fb-input h-10 w-full rounded-xl px-3 text-[14px]"
              />
              {errors.name && (
                <p className="mt-1 text-[12px] text-rose-400">{errors.name.message}</p>
              )}
            </label>

            {/* Colour picker (visual only for now) */}
            <div className="mb-5">
              <span className="mb-2 block text-[12px] font-medium tracking-[0.06em] text-white/55 uppercase">
                Colour
              </span>
              <div className="flex gap-2">
                {GRADIENTS.map(([from, to], i) => (
                  <button
                    key={i}
                    type="button"
                    className="h-6 w-6 rounded-full transition hover:scale-110 active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, ${from}, ${to})`,
                      boxShadow: i === 0 ? `0 0 0 2px rgba(99,102,241,0.6)` : undefined,
                    }}
                    title={`Colour ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="fb-grad-btn h-10 flex-1 rounded-xl text-[14px] font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Creating…" : "Create board"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="h-10 rounded-xl px-4 text-[14px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
