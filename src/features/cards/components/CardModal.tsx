import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { I } from "@/shared/ui/icons";
import { useUpdateCardMutation, useDeleteCardMutation } from "../api/useCardsQuery";
import type { Card } from "../api/cardsApi";

// ── Label colours ──────────────────────────────────────────────────────
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

const LABEL_NAMES = Object.keys(LABEL_HEX);

// ── Checklist helpers ─────────────────────────────────────────────────
type ChecklistItem = { id: string; text: string; done: boolean };

function parseChecklist(description: string | null): { text: string; items: ChecklistItem[] } {
  if (!description) return { text: "", items: [] };
  const lines = description.split("\n");
  const items: ChecklistItem[] = [];
  const textLines: string[] = [];
  for (const line of lines) {
    const m = line.match(/^- \[([ x])\] (.+)$/);
    if (m) items.push({ id: crypto.randomUUID(), text: m[2]!, done: m[1] === "x" });
    else textLines.push(line);
  }
  return { text: textLines.join("\n").trim(), items };
}

function serializeDescription(text: string, items: ChecklistItem[]): string {
  const parts: string[] = [];
  if (text.trim()) parts.push(text.trim());
  if (items.length > 0)
    parts.push(items.map((i) => `- [${i.done ? "x" : " "}] ${i.text}`).join("\n"));
  return parts.join("\n\n");
}

// ── Sidebar action button ─────────────────────────────────────────────
function SidebarAction({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] transition ${
        danger
          ? "text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200"
          : "text-white/65 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      {icon} {label}
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────
type Props = {
  card: Card;
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ── Component ─────────────────────────────────────────────────────────
export function CardModal({ card, boardId, open, onOpenChange }: Props) {
  const updateMutation = useUpdateCardMutation(boardId);
  const deleteMutation = useDeleteCardMutation(boardId);

  const [title, setTitle] = useState(card.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descMode, setDescMode] = useState<"edit" | "preview">("preview");

  const { text: descText, items: checklistItems } = parseChecklist(card.description);
  const [descInput, setDescInput] = useState(descText);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(checklistItems);
  const [newItemText, setNewItemText] = useState("");

  const saveTitle = async () => {
    if (title.trim() && title !== card.title)
      await updateMutation.mutateAsync({ id: card.id, patch: { title: title.trim() } });
    setEditingTitle(false);
  };

  const saveDescription = async () => {
    const desc = serializeDescription(descInput, checklist);
    await updateMutation.mutateAsync({ id: card.id, patch: { description: desc || null } });
    setEditingDesc(false);
  };

  const toggleLabel = async (labelId: string) => {
    const labels = card.labels.includes(labelId)
      ? card.labels.filter((l) => l !== labelId)
      : [...card.labels, labelId];
    await updateMutation.mutateAsync({ id: card.id, patch: { labels } });
  };

  const toggleChecklistItem = async (itemId: string) => {
    const updated = checklist.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i));
    setChecklist(updated);
    const desc = serializeDescription(descInput, updated);
    await updateMutation.mutateAsync({ id: card.id, patch: { description: desc || null } });
  };

  const addChecklistItem = async () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      done: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewItemText("");
    const desc = serializeDescription(descInput, updated);
    await updateMutation.mutateAsync({ id: card.id, patch: { description: desc || null } });
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(card.id);
    onOpenChange(false);
    toast.success("Card deleted");
  };

  const doneCount = checklist.filter((i) => i.done).length;
  const progressPct = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;

  const dueDate = card.due_date ? new Date(card.due_date) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Override DialogContent to get full dark modal */}
      <DialogContent
        className="max-w-[860px] overflow-visible border-0 bg-transparent p-0 shadow-none"
        style={{ maxHeight: "90vh" }}
      >
        <div
          className="fb-glass-strong fb-ring-inner flex w-full flex-col overflow-hidden rounded-2xl"
          style={{
            boxShadow:
              "0 30px 80px -20px rgba(0,0,0,0.75), 0 0 0 1px rgba(139,92,246,0.1), 0 0 80px -20px rgba(139,92,246,0.25)",
            maxHeight: "85vh",
          }}
        >
          {/* Top gradient line */}
          <div className="h-[3px] shrink-0 bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500" />

          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-4 px-7 pt-6 pb-4">
            <div className="min-w-0 flex-1">
              {/* Labels strip */}
              {card.labels.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {card.labels.map((l) => {
                    const hex = LABEL_HEX[l] ?? "#6366f1";
                    return (
                      <span
                        key={l}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium"
                        style={{
                          background: `${hex}22`,
                          color: hex,
                          boxShadow: `inset 0 0 0 1px ${hex}33`,
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
                        {l}
                      </span>
                    );
                  })}
                  {dueDate && (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/15 bg-rose-500/10 px-2 py-1 text-[11.5px] font-medium text-rose-300">
                      {I.Calendar} {format(dueDate, "MMM d")}
                    </span>
                  )}
                </div>
              )}

              {/* Inline-edit title */}
              {editingTitle ? (
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => void saveTitle()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") void saveTitle();
                  }}
                  className="-mb-px w-full border-b border-violet-400/60 bg-transparent pb-1 text-[22px] font-semibold tracking-tight text-white outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingTitle(true)}
                  className="group -mx-1 w-full cursor-text rounded-md px-1 text-left text-[22px] leading-tight font-semibold tracking-tight text-white transition hover:bg-white/[0.03]"
                >
                  {title}
                  <span className="ml-2 inline-block align-middle text-white/50 opacity-0 transition group-hover:opacity-50">
                    {I.Edit}
                  </span>
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button className="rounded-lg p-2 text-white/45 transition hover:bg-white/[0.06] hover:text-white">
                {I.More}
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-lg p-2 text-white/45 transition hover:bg-white/[0.06] hover:text-white"
              >
                {I.X}
              </button>
            </div>
          </div>

          {/* Body: main + sidebar */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* Main column */}
            <div className="fb-scroll min-w-0 flex-1 overflow-y-auto px-7 pb-6">
              {/* Description */}
              <section className="mb-7">
                <div className="mb-2.5 flex items-center justify-between">
                  <h3 className="text-[12px] font-semibold tracking-[0.12em] text-white/55 uppercase">
                    Description
                  </h3>
                  <div className="flex items-center gap-0.5 rounded-md border border-white/[0.06] bg-black/30 p-0.5 text-[11px]">
                    <button
                      onClick={() => {
                        setDescMode("edit");
                        setEditingDesc(true);
                      }}
                      className={`rounded px-2 py-0.5 font-medium transition ${descMode === "edit" ? "bg-white/[0.08] text-white" : "text-white/45 hover:text-white"}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDescMode("preview")}
                      className={`rounded px-2 py-0.5 transition ${descMode === "preview" ? "bg-white/[0.08] font-medium text-white" : "text-white/45 hover:text-white"}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {editingDesc && descMode === "edit" ? (
                  <div className="space-y-2">
                    <textarea
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      placeholder="Add a description… (supports Markdown)"
                      rows={6}
                      autoFocus
                      className="fb-input w-full resize-none rounded-xl p-3 text-[13px] leading-relaxed"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => void saveDescription()}
                        className="fb-grad-btn h-8 rounded-lg px-3 text-[12.5px] font-medium text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDesc(false)}
                        className="h-8 rounded-lg px-3 text-[12.5px] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setDescMode("edit");
                      setEditingDesc(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setDescMode("edit");
                        setEditingDesc(true);
                      }
                    }}
                    className="min-h-[60px] cursor-pointer rounded-xl border border-white/[0.07] bg-black/25 p-4 text-[13px] leading-[1.65] text-white/75 transition hover:border-violet-400/30"
                  >
                    {descInput ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{descInput}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-white/30">Add a description… (supports Markdown)</p>
                    )}
                  </div>
                )}
              </section>

              {/* Checklist */}
              {checklist.length > 0 && (
                <section className="mb-6">
                  <div className="mb-2.5 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.12em] text-white/55 uppercase">
                      Checklist
                      <span className="font-normal tracking-normal text-white/40 normal-case">
                        · {doneCount} of {checklist.length}
                      </span>
                    </h3>
                    <span className="text-[11.5px] font-medium text-white/55">{progressPct}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                      style={{
                        width: `${progressPct}%`,
                        boxShadow: "0 0 12px rgba(139,92,246,0.5)",
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    {checklist.map((item) => (
                      <label
                        key={item.id}
                        className="group flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-white/[0.03]"
                      >
                        <button
                          onClick={() => void toggleChecklistItem(item.id)}
                          className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition ${
                            item.done
                              ? "border-violet-400 bg-gradient-to-br from-indigo-500 to-violet-500"
                              : "border-white/15 bg-black/30 group-hover:border-white/35"
                          }`}
                        >
                          {item.done && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                        <span
                          className={`text-[13px] ${
                            item.done
                              ? "text-white/40 line-through decoration-white/25"
                              : "text-white/85"
                          }`}
                        >
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                  {/* Add checklist item */}
                  <div className="mt-2 flex gap-2">
                    <input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Add item…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void addChecklistItem();
                      }}
                      className="fb-input h-8 flex-1 rounded-lg px-3 text-[12.5px]"
                    />
                    <button
                      onClick={() => void addChecklistItem()}
                      className="fb-grad-btn h-8 rounded-lg px-3 text-[12.5px] font-medium text-white"
                    >
                      Add
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="fb-scroll w-64 shrink-0 overflow-y-auto border-l border-white/[0.06] bg-black/20 p-5">
              <div className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-white/45 uppercase">
                Properties
              </div>

              {/* Label picker */}
              <div className="mb-5">
                <div className="mb-2 text-[11.5px] text-white/55">Labels</div>
                <div className="grid grid-cols-6 gap-1.5">
                  {LABEL_NAMES.map((k) => {
                    const v = LABEL_HEX[k]!;
                    const on = card.labels.includes(k);
                    return (
                      <button
                        key={k}
                        onClick={() => void toggleLabel(k)}
                        className={`relative h-7 rounded-md transition ${on ? "" : "opacity-70 hover:opacity-100"}`}
                        style={{
                          background: v,
                          boxShadow: on
                            ? `0 0 0 2px ${v}55, inset 0 1px 0 rgba(255,255,255,0.25)`
                            : "inset 0 1px 0 rgba(255,255,255,0.18)",
                        }}
                        title={k}
                      >
                        {on && (
                          <svg
                            className="absolute inset-0 m-auto"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due date */}
              <div className="mb-5">
                <div className="mb-2 text-[11.5px] text-white/55">Due date</div>
                <input
                  type="date"
                  value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    void updateMutation.mutateAsync({
                      id: card.id,
                      patch: {
                        due_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                      },
                    })
                  }
                  className="fb-input h-9 w-full rounded-lg px-3 text-[13px]"
                />
              </div>

              {/* Add checklist */}
              {checklist.length === 0 && (
                <div className="mb-5">
                  <button
                    onClick={() => {
                      const item: ChecklistItem = {
                        id: crypto.randomUUID(),
                        text: "New item",
                        done: false,
                      };
                      setChecklist([item]);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] text-white/65 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    {I.Check} Add checklist
                  </button>
                </div>
              )}

              <div className="my-4 h-px bg-white/[0.06]" />

              {/* Actions */}
              <div className="space-y-1">
                <SidebarAction
                  icon={I.Trash}
                  label="Delete card"
                  danger
                  onClick={() => void handleDelete()}
                />
              </div>
            </aside>
          </div>

          {/* Footer status bar */}
          <div className="flex shrink-0 items-center justify-between border-t border-white/[0.05] bg-black/30 px-7 py-2.5 text-[11.5px] text-white/45">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="fb-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" /> Saved
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span>
                Created {dueDate ? format(new Date(card.due_date ?? ""), "MMM d") : "recently"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded border border-white/[0.06] bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-white/55">
                Esc
              </kbd>
              <span>to close</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
