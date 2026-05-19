import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardKeys } from "./keys";
import { createBoard, deleteBoard, fetchBoards, updateBoard } from "./boardsApi";
import type { Board } from "../types";

export function useBoardsQuery(archived = false) {
  return useQuery({
    queryKey: boardKeys.list({ archived }),
    queryFn: () => fetchBoards(archived),
  });
}

export function useCreateBoardMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ name, ownerId }: { name: string; ownerId: string }) =>
      createBoard(name, ownerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

export function useUpdateBoardMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; is_archived?: boolean } }) =>
      updateBoard(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: boardKeys.lists() });
      const prev = qc.getQueriesData<Board[]>({ queryKey: boardKeys.lists() });

      qc.setQueriesData<Board[]>({ queryKey: boardKeys.lists() }, (old) =>
        old?.map((b) => (b.id === id ? { ...b, ...patch } : b)) ?? []
      );

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

export function useDeleteBoardMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBoard(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: boardKeys.lists() });
      const prev = qc.getQueriesData<Board[]>({ queryKey: boardKeys.lists() });

      qc.setQueriesData<Board[]>({ queryKey: boardKeys.lists() }, (old) =>
        old?.filter((b) => b.id !== id) ?? []
      );

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}
