import type { User } from "@supabase/supabase-js";
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

// Deterministic avatar gradient from user id
const AVATAR_GRADIENTS = [
  ["#6366f1", "#8b5cf6"],
  ["#06b6d4", "#3b82f6"],
  ["#10b981", "#06b6d4"],
  ["#f59e0b", "#f97316"],
  ["#ec4899", "#a855f7"],
  ["#f43f5e", "#f97316"],
];

function avatarGradient(userId: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  const pair = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]!;
  return [pair[0]!, pair[1]!];
}

export function PresenceAvatars({ boardId, currentUser }: Props) {
  const { onlineUsers } = usePresence(boardId, currentUser);

  if (onlineUsers.length <= 1) return null;

  return (
    <div className="flex items-center -space-x-2">
      {onlineUsers.slice(0, 5).map((user) => {
        const [from, to] = avatarGradient(user.userId);
        return (
          <Tooltip key={user.userId}>
            <TooltipTrigger asChild>
              <div
                className="grid h-7 w-7 cursor-default place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-[#0c0c14] transition-transform hover:scale-110"
                style={{
                  background: user.avatarUrl
                    ? undefined
                    : `linear-gradient(135deg, ${from}, ${to})`,
                  backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : undefined,
                  backgroundSize: "cover",
                }}
                title={user.fullName ?? user.email}
              >
                {!user.avatarUrl && initials(user.fullName, user.email)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">{user.fullName ?? user.email}</TooltipContent>
          </Tooltip>
        );
      })}
      {onlineUsers.length > 5 && (
        <div className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.08] text-[10px] font-medium text-white/70 ring-2 ring-[#0c0c14]">
          +{onlineUsers.length - 5}
        </div>
      )}
    </div>
  );
}
