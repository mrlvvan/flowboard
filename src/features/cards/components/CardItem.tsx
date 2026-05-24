import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isToday, isPast } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { I } from "@/shared/ui/icons";
import type { Card } from "../api/cardsApi";

const LABEL_HEX: Record<string, string> = {
  red: "#f43f5e",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  green: "#22c55e",
  emerald: "#10b981",
  cyan: "#06b6d4",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#a855f7",
  purple: "#8b5cf6",
  pink: "#ec4899",
};

type Props = {
  card: Card;
  onOpen: (card: Card) => void;
};

export function CardItem({ card, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDate = card.due_date ? new Date(card.due_date) : null;
  const dueTone = dueDate && (isToday(dueDate) || isPast(dueDate)) ? "red" : "default";

  const hasChecklist = card.description?.includes("- [") ?? false;
  const hasMeta = dueDate || hasChecklist;

  // Count checklist progress
  const checkMatches = card.description?.matchAll(/^- \[( |x)\] /gm);
  const checkItems = checkMatches ? [...checkMatches] : [];
  const doneItems = checkItems.filter((m) => m[1] === "x").length;
  const totalItems = checkItems.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(card)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(card);
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group fb-glass fb-lift relative cursor-pointer rounded-xl p-3 focus-visible:ring-1 focus-visible:ring-violet-400/50 focus-visible:outline-none",
        isDragging && "opacity-50 ring-1 ring-violet-400/40"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag card"
        className="fb-handle absolute top-1/2 left-1 h-7 w-1.5 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-70 active:cursor-grabbing"
      />

      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1">
          {card.labels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium"
              style={{
                background: `${LABEL_HEX[label] ?? "#6366f1"}22`,
                color: LABEL_HEX[label] ?? "#6366f1",
                boxShadow: `inset 0 0 0 1px ${LABEL_HEX[label] ?? "#6366f1"}33`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: LABEL_HEX[label] ?? "#6366f1" }}
              />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="text-[13px] leading-[1.4] font-medium text-white/92">{card.title}</h4>

      {/* Meta row */}
      {hasMeta && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
          {dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-medium",
                dueTone === "red"
                  ? "rounded-md border border-rose-500/15 bg-rose-500/10 px-1.5 py-[2px] text-rose-300"
                  : "text-white/50"
              )}
            >
              {I.Calendar}
              {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          {totalItems > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px]",
                doneItems === totalItems ? "text-emerald-400" : "text-white/45"
              )}
            >
              {I.Check} {doneItems}/{totalItems}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
