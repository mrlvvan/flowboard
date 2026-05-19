import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { usePresence } from "./usePresence";

type Props = {
  boardId: string;
  currentUser: User;
};

function initials(name: string | null, email: string) {
  if (name) return name.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function PresenceAvatars({ boardId, currentUser }: Props) {
  const { onlineUsers } = usePresence(boardId, currentUser);

  if (onlineUsers.length <= 1) return null;

  return (
    <div className="flex items-center -space-x-2">
      {onlineUsers.slice(0, 5).map((user) => (
        <Tooltip key={user.userId}>
          <TooltipTrigger asChild>
            <Avatar className="ring-background h-7 w-7 cursor-default ring-2">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName ?? user.email} />
              <AvatarFallback className="text-[10px]">
                {initials(user.fullName, user.email)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{user.fullName ?? user.email}</TooltipContent>
        </Tooltip>
      ))}
      {onlineUsers.length > 5 && (
        <div className="bg-muted ring-background flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium ring-2">
          +{onlineUsers.length - 5}
        </div>
      )}
    </div>
  );
}
