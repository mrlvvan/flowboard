import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cardKeys } from "./keys";
import { formatSupabaseError } from "@/shared/lib/supabaseError";
import { createCard, deleteCard, fetchCards, updateCard, type Card } from "./cardsApi";

export function useCardsQuery(boardId: string) {
  return useQuery({
    queryKey: cardKeys.byBoard(boardId),
    queryFn: () => fetchCards(boardId),
  });
}

export function useCreateCardMutation(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      columnId,
      title,
      afterPosition,
    }: {
      columnId: string;
      title: string;
      afterPosition?: string;
    }) => createCard(boardId, columnId, title, afterPosition),
    onSuccess: () => void qc.invalidateQueries({ queryKey: cardKeys.byBoard(boardId) }),
    onError: (err) => {
      console.error("[createCard] failed", err);
      toast.error(formatSupabaseError(err, "Create card"), { duration: 8000 });
    },
  });
}

export function useUpdateCardMutation(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateCard>[1] }) =>
      updateCard(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: cardKeys.byBoard(boardId) });
      const prev = qc.getQueryData<Card[]>(cardKeys.byBoard(boardId));
      qc.setQueryData<Card[]>(
        cardKeys.byBoard(boardId),
        (old) => old?.map((c) => (c.id === id ? { ...c, ...patch } : c)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(cardKeys.byBoard(boardId), ctx.prev);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: cardKeys.byBoard(boardId) }),
  });
}

export function useDeleteCardMutation(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCard(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: cardKeys.byBoard(boardId) });
      const prev = qc.getQueryData<Card[]>(cardKeys.byBoard(boardId));
      qc.setQueryData<Card[]>(
        cardKeys.byBoard(boardId),
        (old) => old?.filter((c) => c.id !== id) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(cardKeys.byBoard(boardId), ctx.prev);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: cardKeys.byBoard(boardId) }),
  });
}
