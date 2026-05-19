import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { CardItem } from "@/features/cards/components/CardItem";
import { InlineAddCard } from "@/features/cards/components/InlineAddCard";
import { CardModal } from "@/features/cards/components/CardModal";
import type { Column } from "../api/columnsApi";
import type { Card } from "@/features/cards/api/cardsApi";

type Props = {
  column: Column;
  cards: Card[];
  boardId: string;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

export function KanbanColumn({ column, cards, boardId, onRename, onDelete }: Props) {
  const { t } = useTranslation("cards");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(column.name);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", column },
  });

  const { setNodeRef: setDropRef } = useDroppable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== column.name) onRename(column.id, trimmed);
    setEditingName(false);
  };

  const lastPosition = cards[cards.length - 1]?.position;

  return (
    <>
      <div
        ref={setSortableRef}
        style={style}
        className={cn(
          "flex h-full w-72 shrink-0 flex-col rounded-xl border bg-muted/50",
          isDragging && "opacity-50"
        )}
      >
        {/* Column header */}
        <div className="flex items-center gap-1 px-3 py-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 active:cursor-grabbing"
            aria-label="Drag column"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {editingName ? (
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setNameInput(column.name); setEditingName(false); } }}
              className="h-7 flex-1 text-sm font-medium"
              autoFocus
            />
          ) : (
            <button
              onClick={() => { setEditingName(true); setNameInput(column.name); }}
              className="flex-1 text-left text-sm font-medium hover:underline"
            >
              {column.name}
            </button>
          )}

          <span className="text-xs text-muted-foreground">{cards.length}</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingName(true)}>
                <Pencil className="mr-2 h-4 w-4" /> {t("columnName")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(column.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> {t("deleteColumn")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Cards */}
        <div ref={setDropRef} className="flex-1 overflow-y-auto px-2 pb-2">
          <SortableContext
            items={cards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 py-1">
              {cards.map((card) => (
                <CardItem key={card.id} card={card} onOpen={setSelectedCard} />
              ))}
            </div>
          </SortableContext>
        </div>

        {/* Add card */}
        <div className="p-2 pt-0">
          <InlineAddCard boardId={boardId} columnId={column.id} lastPosition={lastPosition} />
        </div>
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardId={boardId}
          open={!!selectedCard}
          onOpenChange={(open) => { if (!open) setSelectedCard(null); }}
        />
      )}
    </>
  );
}
