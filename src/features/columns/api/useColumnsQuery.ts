import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { columnKeys } from "./keys";
import { formatSupabaseError } from "@/shared/lib/supabaseError";
import { createColumn, deleteColumn, fetchColumns, updateColumn, type Column } from "./columnsApi";

export function useColumnsQuery(boardId: string) {
  return useQuery({
    queryKey: columnKeys.byBoard(boardId),
    queryFn: () => fetchColumns(boardId),
  });
}

export function useCreateColumnMutation(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, afterPosition }: { name: string; afterPosition?: string }) =>
      createColumn(boardId, name, afterPosition),
    onSuccess: () => void qc.invalidateQueries({ queryKey: columnKeys.byBoard(boardId) }),
    onError: (err) => {
      console.error("[createColumn] failed", err);
      toast.error(formatSupabaseError(err, "Create column"), { duration: 8000 });
    },
  });
}

export function useUpdateColumnMutation(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; position?: string } }) =>
      updateColumn(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: columnKeys.byBoard(boardId) });
      const prev = qc.getQueryData<Column[]>(columnKeys.byBoard(boardId));
      qc.setQueryData<Column[]>(
        columnKeys.byBoard(boardId),
        (old) =>
          old
            ?.map((c) => (c.id === id ? { ...c, ...patch } : c))
            .sort((a, b) => a.position.localeCompare(b.position)) ?? []
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(columnKeys.byBoard(boardId), ctx.prev);
      console.error("[updateColumn] failed", err);
      toast.error(formatSupabaseError(err, "Update column"), { duration: 8000 });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: columnKeys.byBoard(boardId) }),
  });
}

export function useDeleteColumnMutation(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteColumn(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: columnKeys.byBoard(boardId) });
      const prev = qc.getQueryData<Column[]>(columnKeys.byBoard(boardId));
      qc.setQueryData<Column[]>(
        columnKeys.byBoard(boardId),
        (old) => old?.filter((c) => c.id !== id) ?? []
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(columnKeys.byBoard(boardId), ctx.prev);
      console.error("[deleteColumn] failed", err);
      toast.error(formatSupabaseError(err, "Delete column"), { duration: 8000 });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: columnKeys.byBoard(boardId) }),
  });
}
