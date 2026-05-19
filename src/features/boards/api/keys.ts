export const boardKeys = {
  all: ["boards"] as const,
  lists: () => [...boardKeys.all, "list"] as const,
  list: (filters: { archived?: boolean }) => [...boardKeys.lists(), filters] as const,
  detail: (id: string) => [...boardKeys.all, "detail", id] as const,
};
