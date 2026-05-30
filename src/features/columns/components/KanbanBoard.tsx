import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { I } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import {
  useColumnsQuery,
  useUpdateColumnMutation,
  useDeleteColumnMutation,
  useCreateColumnMutation,
} from "../api/useColumnsQuery";
import { useCardsQuery, useUpdateCardMutation } from "@/features/cards/api/useCardsQuery";
import { positionBetween } from "@/shared/lib/position";
import { KanbanColumn } from "./KanbanColumn";
import type { Column } from "../api/columnsApi";
import type { Card } from "@/features/cards/api/cardsApi";

type Props = {
  boardId: string;
  filterLabels?: string[];
  filterOverdue?: boolean;
  filterDueSoon?: boolean;
};

function applyCardFilters(
  cards: Card[],
  labels?: string[],
  overdue?: boolean,
  dueSoon?: boolean
): Card[] {
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  return cards.filter((c) => {
    if (labels?.length) {
      if (!labels.some((l) => c.labels.includes(l))) return false;
    }
    if (overdue) {
      if (!c.due_date) return false;
      if (new Date(c.due_date).getTime() >= now) return false;
    }
    if (dueSoon) {
      if (!c.due_date) return false;
      const t = new Date(c.due_date).getTime();
      if (t < now || t > now + threeDays) return false;
    }
    return true;
  });
}

export function KanbanBoard({ boardId, filterLabels, filterOverdue, filterDueSoon }: Props) {
  const { t } = useTranslation("cards");
  const { t: tc } = useTranslation("common");
  const { data: columns = [], isLoading: colLoading } = useColumnsQuery(boardId);
  const { data: rawCards = [], isLoading: cardLoading } = useCardsQuery(boardId);

  const hasFilters = !!(filterLabels?.length || filterOverdue || filterDueSoon);
  const cards = hasFilters
    ? applyCardFilters(rawCards, filterLabels, filterOverdue, filterDueSoon)
    : rawCards;

  const createColumn = useCreateColumnMutation(boardId);
  const updateColumn = useUpdateColumnMutation(boardId);
  const deleteColumn = useDeleteColumnMutation(boardId);
  const updateCard = useUpdateCardMutation(boardId);

  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filtered cards for display
  const cardsForColumn = (colId: string) =>
    cards.filter((c) => c.column_id === colId).sort((a, b) => a.position.localeCompare(b.position));

  // Unfiltered cards for DnD position calculation
  const rawCardsForColumn = (colId: string) =>
    rawCards
      .filter((c) => c.column_id === colId)
      .sort((a, b) => a.position.localeCompare(b.position));

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "column") setActiveColumn(data.column as Column);
    if (data?.type === "card") setActiveCard(data.card as Card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeData = active.data.current;
    const overData = over.data.current;
    if (activeData?.type !== "card") return;

    const activeCardData = activeData.card as Card;
    if (overData?.type === "column") {
      const targetColumn = overData.column as Column;
      if (activeCardData.column_id !== targetColumn.id) {
        void updateCard.mutateAsync({
          id: activeCardData.id,
          patch: { column_id: targetColumn.id, position: positionBetween(undefined, undefined) },
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveCard(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === "column" && overData?.type === "column") {
      const oldIndex = columns.findIndex((c) => c.id === active.id);
      const newIndex = columns.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(columns, oldIndex, newIndex);
      const prev = reordered[newIndex - 1]?.position;
      const next = reordered[newIndex + 1]?.position;
      const newPosition = positionBetween(prev, next);
      void updateColumn.mutateAsync({ id: active.id as string, patch: { position: newPosition } });
      return;
    }

    if (activeData?.type === "card" && overData?.type === "card") {
      const activeCardData = activeData.card as Card;
      const overCard = overData.card as Card;
      const targetColumnCards = rawCardsForColumn(overCard.column_id);
      const overIndex = targetColumnCards.findIndex((c) => c.id === overCard.id);
      const prev = targetColumnCards[overIndex - 1]?.position;
      const next = targetColumnCards[overIndex]?.position;
      const newPosition = positionBetween(prev, next);
      void updateCard.mutateAsync({
        id: activeCardData.id,
        patch: { column_id: overCard.column_id, position: newPosition },
      });
    }
  };

  const addColumn = async () => {
    const name = newColName.trim();
    if (!name) return;
    const lastPos = columns[columns.length - 1]?.position;
    await createColumn.mutateAsync({ name, afterPosition: lastPos });
    setNewColName("");
    setAddingColumn(false);
  };

  if (colLoading || cardLoading) {
    return (
      <div className="flex h-full gap-4 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="fb-glass h-64 w-[300px] shrink-0 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  // Empty board state — no columns yet
  if (!colLoading && columns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div
            className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl"
            style={{
              background: "rgba(99,102,241,0.1)",
              boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.2)",
            }}
          >
            {I.Plus}
          </div>
          <h2 className="mb-2 text-[18px] font-semibold tracking-tight text-white">
            {t("addFirstColumn")}
          </h2>
          <p className="mb-6 text-[13.5px] leading-relaxed text-white/50">{t("firstColumnHint")}</p>
          {/* Quick-start button scrolls to the Add column button */}
          <button
            onClick={() => {
              // Trigger the Add column input at the end of the board
              const btn = document.querySelector<HTMLButtonElement>("[data-add-column]");
              btn?.click();
            }}
            className="fb-grad-btn inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[14px] font-semibold text-white"
          >
            {I.Plus} {t("addColumn")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="fb-scroll flex h-full gap-4 overflow-x-auto p-6 pb-8">
        <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          {columns.map((col, idx) => (
            <KanbanColumn
              key={col.id}
              column={col}
              cards={cardsForColumn(col.id)}
              boardId={boardId}
              colorIndex={idx}
              onRename={(id, name) => void updateColumn.mutateAsync({ id, patch: { name } })}
              onDelete={(id) => void deleteColumn.mutateAsync(id)}
            />
          ))}
        </SortableContext>

        {/* Add column */}
        <div className="w-[280px] shrink-0 self-start">
          {addingColumn ? (
            <div className="fb-glass space-y-2 rounded-2xl p-3">
              <Input
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder={t("columnNamePlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void addColumn();
                  if (e.key === "Escape") setAddingColumn(false);
                }}
                autoFocus
                className="border-white/10 bg-black/30 text-white placeholder:text-white/30 focus-visible:border-violet-400/50 focus-visible:ring-0"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => void addColumn()}
                  className="fb-grad-btn h-8 rounded-lg px-3 text-[13px] font-medium text-white"
                >
                  {t("addColumn")}
                </button>
                <button
                  onClick={() => setAddingColumn(false)}
                  className="h-8 rounded-lg px-3 text-[13px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
                >
                  {tc("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              data-add-column
              onClick={() => setAddingColumn(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/[0.08] py-3 text-[13px] font-medium text-white/50 transition hover:border-violet-400/40 hover:bg-white/[0.02] hover:text-white"
            >
              {I.Plus} {t("addColumn")}
            </button>
          )}
        </div>
      </div>

      {/* Drag overlays */}
      {createPortal(
        <DragOverlay>
          {activeCard && (
            <div className="rotate-2 cursor-grabbing opacity-90">
              <div className="fb-glass w-[280px] rounded-xl px-3 py-2 shadow-2xl">
                <p className="text-sm text-white/90">{activeCard.title}</p>
              </div>
            </div>
          )}
          {activeColumn && (
            <div className="rotate-1 cursor-grabbing opacity-80">
              <div className="fb-glass w-[300px] rounded-2xl px-3 py-2 shadow-2xl">
                <p className="text-sm font-medium text-white/90">{activeColumn.name}</p>
              </div>
            </div>
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
