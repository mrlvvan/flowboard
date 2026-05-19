export const columnKeys = {
  all: ["columns"] as const,
  byBoard: (boardId: string) => [...columnKeys.all, boardId] as const,
};
