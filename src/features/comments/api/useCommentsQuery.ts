import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  type CommentWithAuthor,
} from "./commentsApi";

export const commentKeys = {
  all: ["comments"] as const,
  forCard: (cardId: string) => ["comments", "card", cardId] as const,
};

export function useCommentsQuery(cardId: string) {
  return useQuery({
    queryKey: commentKeys.forCard(cardId),
    queryFn: () => fetchComments(cardId),
    enabled: !!cardId,
  });
}

export function useCreateCommentMutation(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: commentKeys.forCard(cardId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    },
  });
}

export function useUpdateCommentMutation(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => updateComment(id, body),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: commentKeys.forCard(cardId) });
      const prev = qc.getQueryData<CommentWithAuthor[]>(commentKeys.forCard(cardId));
      if (prev) {
        qc.setQueryData<CommentWithAuthor[]>(
          commentKeys.forCard(cardId),
          prev.map((c) => (c.id === id ? { ...c, body, updated_at: new Date().toISOString() } : c))
        );
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(commentKeys.forCard(cardId), ctx.prev);
      toast.error(err instanceof Error ? err.message : "Failed to update comment");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: commentKeys.forCard(cardId) });
    },
  });
}

export function useDeleteCommentMutation(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: commentKeys.forCard(cardId) });
      const prev = qc.getQueryData<CommentWithAuthor[]>(commentKeys.forCard(cardId));
      if (prev) {
        qc.setQueryData<CommentWithAuthor[]>(
          commentKeys.forCard(cardId),
          prev.filter((c) => c.id !== id)
        );
      }
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(commentKeys.forCard(cardId), ctx.prev);
      toast.error(err instanceof Error ? err.message : "Failed to delete comment");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: commentKeys.forCard(cardId) });
    },
  });
}
