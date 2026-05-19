import { useEffect, useState, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabase";

export interface PresenceUser {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  email: string;
  onlineAt: string;
}

export function usePresence(boardId: string, currentUser: User) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`presence:${boardId}`, {
      config: { presence: { key: currentUser.id } },
    });

    const me: PresenceUser = {
      userId: currentUser.id,
      fullName: (currentUser.user_metadata["full_name"] as string | undefined) ?? null,
      avatarUrl: (currentUser.user_metadata["avatar_url"] as string | undefined) ?? null,
      email: currentUser.email ?? "",
      onlineAt: new Date().toISOString(),
    };

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = Object.values(state)
          .flat()
          .filter((u) => !!u && "userId" in u)
          .map((u) => ({
            userId: u.userId,
            fullName: u.fullName,
            avatarUrl: u.avatarUrl,
            email: u.email,
            onlineAt: u.onlineAt,
          }));
        setOnlineUsers(users);
      })
      .subscribe((status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          void channel.track(me);
        }
      });

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [boardId, currentUser]);

  return { onlineUsers };
}
