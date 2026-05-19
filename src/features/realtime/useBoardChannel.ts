import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabase";
import { boardKeys } from "@/features/boards/api/keys";
import { columnKeys } from "@/features/columns/api/keys";
import { cardKeys } from "@/features/cards/api/keys";

/**
 * Subscribes to Supabase Realtime for a board and invalidates
 * TanStack Query caches when remote changes arrive.
 */
export function useBoardChannel(boardId: string) {
  const qc = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`board:${boardId}`)
      // Columns
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns", filter: `board_id=eq.${boardId}` },
        () => void qc.invalidateQueries({ queryKey: columnKeys.byBoard(boardId) })
      )
      // Cards
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cards", filter: `board_id=eq.${boardId}` },
        () => void qc.invalidateQueries({ queryKey: cardKeys.byBoard(boardId) })
      )
      // Board meta
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "boards", filter: `id=eq.${boardId}` },
        () => void qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) })
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [boardId, qc]);
}
