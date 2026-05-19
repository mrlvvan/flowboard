import { useState } from "react";
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
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { useColumnsQuery, useUpdateColumnMutation, useDeleteColumnMutation, useCreateColumnMutation } from "../api/useColumnsQuery";
import { useCardsQuery, useUpdateCardMutation } from "@/features/cards/api/useCardsQuery";
import { positionBetween } from "@/shared/lib/position";
import { KanbanColumn } from "./KanbanColumn";
import type { Column } from "../api/columnsApi";
import type { Card } from "@/features/cards/api/cardsApi";

type Props = { boardId: string };

export function KanbanBoard({ boardId }: Props) {
  const { t } = useTranslation("cards");
  const { data: columns = [], isLoading: colLoading } = useColumnsQuery(boardId);
  const { data: cards = [], isLoading: cardLoading } = useCardsQuery(boardId);

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

  const cardsForColumn = (colId: string) =>
    cards.filter((c) => c.column_id === colId).sort((a, b) => a.position.localeCompare(b.position));

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

    const activeCard = activeData.card as Card;
    // Dropping card over a column (empty)
    if (overData?.type === "column") {
      const targetColumn = overData.column as Column;
      if (activeCard.column_id !== targetColumn.id) {
        void updateCard.mutateAsync({
          id: activeCard.id,
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

    // Column reorder
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

    // Card reorder / move
    if (activeData?.type === "card" && overData?.type === "card") {
      const activeCard = activeData.card as Card;
      const overCard = overData.card as Card;
      const targetColumnCards = cardsForColumn(overCard.column_id);
      const overIndex = targetColumnCards.findIndex((c) => c.id === overCard.id);
      const prev = targetColumnCards[overIndex - 1]?.position;
      const next = targetColumnCards[overIndex]?.position;
      const newPosition = positionBetween(prev, next);
      void updateCard.mutateAsync({
        id: activeCard.id,
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
      <div className="flex gap-4 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-72 rounded-xl" />
        ))}
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
      <div className="flex h-full gap-4 overflow-x-auto p-6 pb-8">
        <SortableContext
          items={columns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              cards={cardsForColumn(col.id)}
              boardId={boardId}
              onRename={(id, name) => void updateColumn.mutateAsync({ id, patch: { name } })}
              onDelete={(id) => void deleteColumn.mutateAsync(id)}
            />
          ))}
        </SortableContext>

        {/* Add column */}
        <div className="w-72 shrink-0">
          {addingColumn ? (
            <div className="rounded-xl border bg-muted/50 p-3 space-y-2">
              <Input
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder={t("columnNamePlaceholder")}
                onKeyDown={(e) => { if (e.key === "Enter") void addColumn(); if (e.key === "Escape") setAddingColumn(false); }}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void addColumn()}>{t("addColumn")}</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingColumn(false)}>✕</Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 rounded-xl border-dashed"
              onClick={() => setAddingColumn(true)}
            >
              <Plus className="h-4 w-4" />
              {t("addColumn")}
            </Button>
          )}
        </div>
      </div>

      {/* Drag overlays */}
      {createPortal(
        <DragOverlay>
          {activeCard && (
            <div className="rotate-2 cursor-grabbing opacity-80">
              <div className="rounded-lg border bg-card px-3 py-2 shadow-xl">
                <p className="text-sm">{activeCard.title}</p>
              </div>
            </div>
          )}
          {activeColumn && (
            <div className="rotate-1 cursor-grabbing opacity-80">
              <div className="w-72 rounded-xl border bg-muted/50 px-3 py-2 shadow-xl">
                <p className="text-sm font-medium">{activeColumn.name}</p>
              </div>
            </div>
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
