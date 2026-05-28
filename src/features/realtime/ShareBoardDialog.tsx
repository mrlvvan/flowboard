import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { I } from "@/shared/ui/icons";
import { supabase } from "@/shared/lib/supabase";

const schema = z.object({ email: z.string().email("Invalid email") });
type FormData = z.infer<typeof schema>;

type Props = {
  boardId: string;
  boardName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareBoardDialog({ boardId, boardName, open, onOpenChange }: Props) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/board/${boardId}`;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (data: FormData) => {
    // Use SECURITY DEFINER RPC — RLS hides profiles of users you don't share a board with
    const { data: matches, error: lookupError } = await supabase.rpc("find_user_by_email", {
      p_email: data.email,
    });

    if (lookupError) {
      toast.error(lookupError.message);
      return;
    }

    const profile = Array.isArray(matches) ? matches[0] : null;
    if (!profile) {
      toast.error("User not found. They need to sign up first.");
      return;
    }

    const { error: memberError } = await supabase
      .from("board_members")
      .insert({ board_id: boardId, user_id: profile.id, role: "editor" });

    if (memberError) {
      if (memberError.code === "23505") {
        toast.error("This user already has access to the board.");
      } else {
        toast.error(memberError.message);
      }
      return;
    }

    toast.success(`${data.email} can now access this board`);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] border-0 bg-transparent p-0 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Share board</DialogTitle>
        </DialogHeader>
        <div
          className="fb-glass-strong fb-ring-inner overflow-hidden rounded-2xl"
          style={{
            boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.12)",
          }}
        >
          <div className="h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500" />
          <div className="px-6 pt-5 pb-6">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-semibold text-white">
                  Share &ldquo;{boardName}&rdquo;
                </h2>
                <p className="mt-0.5 text-[12.5px] text-white/45">Invite people to collaborate</p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              >
                {I.X}
              </button>
            </div>

            {/* Invite by email */}
            <form onSubmit={handleSubmit(onSubmit)} className="mb-5">
              <span className="mb-2 block text-[11.5px] font-medium tracking-[0.06em] text-white/55 uppercase">
                Invite by email
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-white/35">
                    {I.Mail}
                  </span>
                  <input
                    type="email"
                    placeholder="colleague@example.com"
                    {...register("email")}
                    className="fb-input h-10 w-full rounded-xl pr-3 pl-9 text-[13.5px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="fb-grad-btn h-10 rounded-xl px-4 text-[13.5px] font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "…" : "Invite"}
                </button>
              </div>
              {errors.email && (
                <p className="mt-1.5 text-[12px] text-rose-400">{errors.email.message}</p>
              )}
            </form>

            {/* Divider */}
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[11px] text-white/35">or share link</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            {/* Copy link */}
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-black/30 px-3 py-2">
              <span className="flex-1 truncate font-mono text-[12px] text-white/50">
                {inviteUrl}
              </span>
              <button
                onClick={() => void copyLink()}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white"
                }`}
              >
                {copied ? I.Check : I.Share}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Role note */}
            <p className="mt-3 text-[11.5px] text-white/35">
              Invited members get <span className="text-white/55">editor</span> access by default.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
