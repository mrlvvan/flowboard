import { useMemo, useState } from "react";
import MiniSearch from "minisearch";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";

interface SearchResult {
  id: string;
  title: string;
  type: "board" | "card";
  boardId?: string;
  score: number;
}

export function useSearch() {
  const [query, setQuery] = useState("");

  const boards = useLiveQuery(() => db.boards.toArray(), []);
  const cards = useLiveQuery(() => db.cards.toArray(), []);

  const index = useMemo(() => {
    const ms = new MiniSearch<{
      id: string;
      title: string;
      description?: string;
      type: string;
      boardId?: string;
    }>({
      fields: ["title", "description"],
      storeFields: ["title", "type", "boardId"],
      searchOptions: { prefix: true, fuzzy: 0.2 },
    });

    const docs = [
      ...(boards ?? []).map((b) => ({
        id: `board:${b.id}`,
        title: b.name,
        type: "board" as const,
      })),
      ...(cards ?? []).map((c) => ({
        id: `card:${c.id}`,
        title: c.title,
        description: c.description ?? "",
        type: "card" as const,
        boardId: c.board_id,
      })),
    ];

    ms.addAll(docs);
    return ms;
  }, [boards, cards]);

  const results: SearchResult[] = useMemo(() => {
    if (query.trim().length < 2) return [];
    return index.search(query).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      type: r.type as "board" | "card",
      boardId: r.boardId as string | undefined,
      score: r.score,
    }));
  }, [index, query]);

  return { query, setQuery, results };
}
