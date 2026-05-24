import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { I } from "@/shared/ui/icons";
import { CardItem } from "@/features/cards/components/CardItem";
import { InlineAddCard } from "@/features/cards/components/InlineAddCard";
import { CardModal } from "@/features/cards/components/CardModal";
import type { Column } from "../api/columnsApi";
import type { Card } from "@/features/cards/api/cardsApi";

// Deterministic colour for each column based on its position index
const COL_COLORS = [
  "#64748b",
  "#6366f1",
  "#f59e0b",
  "#a855f7",
  "#10b981",
  "#06b6d4",
  "#f43f5e",
  "#8b5cf6",
];

type Props = {
  column: Column;
  cards: Card[];
  boardId: string;
  colorIndex?: number;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

export function KanbanColumn({
  column,
  cards,
  boardId,
  colorIndex = 0,
  onRename,
  onDelete,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(column.name);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [addingCard, setAddingCard] = useState(false);

  const color = COL_COLORS[colorIndex % COL_COLORS.length] ?? "#64748b";

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: "column", column } });

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
          "fb-glass flex max-h-full w-[300px] shrink-0 flex-col rounded-2xl",
          isDragging && "opacity-50"
        )}
      >
        {/* Column header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none text-white/30 hover:text-white/60 active:cursor-grabbing"
              aria-label="Drag column"
            >
              <span className="fb-handle inline-block h-4 w-1.5" />
            </button>

            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />

            {editingName ? (
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") {
                    setNameInput(column.name);
                    setEditingName(false);
                  }
                }}
                className="h-6 flex-1 rounded-none border-0 border-b border-violet-400/60 bg-transparent px-0 text-xs font-semibold text-white focus-visible:ring-0"
                autoFocus
              />
            ) : (
              <button
                onClick={() => {
                  setEditingName(true);
                  setNameInput(column.name);
                }}
                className="truncate text-[12.5px] font-semibold tracking-[0.06em] text-white/85 uppercase hover:text-white"
              >
                {column.name}
              </button>
            )}

            <span className="ml-0.5 shrink-0 rounded-md bg-white/[0.06] px-1.5 py-[1px] text-[11px] font-medium text-white/50">
              {cards.length}
            </span>
          </div>

          <div className="-mr-1 flex items-center">
            <button
              className="rounded-md p-1.5 text-white/40 transition hover:bg-white/[0.05] hover:text-white"
              onClick={() => setAddingCard(true)}
              title="Add card"
            >
              {I.Plus}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-md p-1.5 text-white/40 transition hover:bg-white/[0.05] hover:text-white">
                  {I.More}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-white/10 bg-[#13131f] text-white">
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-white/[0.05] focus:bg-white/[0.05]"
                  onClick={() => {
                    setEditingName(true);
                    setNameInput(column.name);
                  }}
                >
                  Rename column
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="cursor-pointer text-rose-300 focus:bg-rose-500/10 focus:text-rose-200"
                  onClick={() => onDelete(column.id)}
                >
                  Delete column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Cards */}
        <div
          ref={setDropRef}
          className="fb-scroll flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2"
        >
          <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence initial={false}>
              {cards.map((card) => (
                <CardItem key={card.id} card={card} onOpen={setSelectedCard} />
              ))}
            </AnimatePresence>
          </SortableContext>

          {/* Add card inline */}
          <InlineAddCard
            boardId={boardId}
            columnId={column.id}
            lastPosition={lastPosition}
            forceOpen={addingCard}
            onForceOpenHandled={() => setAddingCard(false)}
          />
        </div>
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardId={boardId}
          open={!!selectedCard}
          onOpenChange={(open) => {
            if (!open) setSelectedCard(null);
          }}
        />
      )}
    </>
  );
}
