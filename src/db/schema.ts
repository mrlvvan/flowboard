import Dexie, { type EntityTable } from "dexie";
import type { Tables } from "@/shared/lib/database.types";

export type LocalBoard = Tables<"boards">;
export type LocalColumn = Tables<"columns">;
export type LocalCard = Tables<"cards">;

export type SyncOperation = "create" | "update" | "delete";
export type SyncTable = "boards" | "columns" | "cards";

export interface SyncQueueItem {
  id?: number; // auto-increment
  table: SyncTable;
  operation: SyncOperation;
  recordId: string;
  payload: Record<string, unknown>;
  createdAt: number; // Date.now()
  attempts: number;
  lastError?: string;
}

export class FlowBoardDB extends Dexie {
  boards!: EntityTable<LocalBoard, "id">;
  columns!: EntityTable<LocalColumn, "id">;
  cards!: EntityTable<LocalCard, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;

  constructor() {
    super("flowboard");

    this.version(1).stores({
      boards: "id, owner_id, is_archived, updated_at",
      columns: "id, board_id, position, updated_at",
      cards: "id, column_id, board_id, position, updated_at",
      syncQueue: "++id, table, recordId, createdAt",
    });
  }
}

export const db = new FlowBoardDB();
