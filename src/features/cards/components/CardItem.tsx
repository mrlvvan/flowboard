import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/shared/lib/utils";
import type { Card } from "../api/cardsApi";

const LABEL_COLORS: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
};

type Props = {
  card: Card;
  onOpen: (card: Card) => void;
};

export function CardItem({ card, onOpen }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDate = card.due_date ? new Date(card.due_date) : null;
  const dueDateClass = dueDate
    ? isToday(dueDate)
      ? "text-yellow-600 dark:text-yellow-400"
      : isPast(dueDate)
        ? "text-destructive"
        : "text-muted-foreground"
    : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative rounded-lg border bg-card px-3 py-2 shadow-sm transition-shadow hover:shadow-md cursor-pointer",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(card)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(card); }}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 cursor-grab touch-none p-0.5 text-muted-foreground transition-opacity active:cursor-grabbing",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag card"
      >
        <GripVertical className="h-3 w-3" />
      </button>

      <div className="pl-3">
        {/* Labels */}
        {card.labels.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {card.labels.map((label) => (
              <span
                key={label}
                className={cn("h-1.5 w-8 rounded-full", LABEL_COLORS[label] ?? "bg-muted")}
              />
            ))}
          </div>
        )}

        <p className="text-sm leading-snug">{card.title}</p>

        {/* Footer info */}
        {dueDate && (
          <div className={cn("mt-1.5 flex items-center gap-1 text-xs", dueDateClass)}>
            <Calendar className="h-3 w-3" />
            {format(dueDate, "MMM d")}
          </div>
        )}
      </div>
    </div>
  );
}
