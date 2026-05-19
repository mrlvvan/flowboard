import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserPlus, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { supabase } from "@/shared/lib/supabase";

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

type Props = {
  boardId: string;
  boardName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareBoardDialog({ boardId, boardName, open, onOpenChange }: Props) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/invite/${boardId}`;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (data: FormData) => {
    // Look up user by email and add as board_member
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .single();

    if (error || !profile) {
      toast.error("User not found. They must sign up first.");
      return;
    }

    const { error: memberError } = await supabase
      .from("board_members")
      .insert({ board_id: boardId, user_id: profile.id, role: "editor" });

    if (memberError) {
      toast.error(memberError.message);
      return;
    }

    toast.success(`Invited ${data.email}`);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Share &ldquo;{boardName}&rdquo;
          </DialogTitle>
          <DialogDescription>Invite people to collaborate on this board.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invite by email */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <Label>Invite by email</Label>
            <div className="flex gap-2">
              <Input type="email" placeholder="colleague@example.com" {...register("email")} />
              <Button type="submit" disabled={isSubmitting}>
                Invite
              </Button>
            </div>
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </form>

          {/* Copy link */}
          <div className="space-y-2">
            <Label>Or share link</Label>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="text-muted-foreground text-xs" />
              <Button variant="outline" size="icon" onClick={() => void copyLink()}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
