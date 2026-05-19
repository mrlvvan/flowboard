export const cardKeys = {
  all: ["cards"] as const,
  byBoard: (boardId: string) => [...cardKeys.all, boardId] as const,
  detail: (id: string) => [...cardKeys.all, "detail", id] as const,
};
