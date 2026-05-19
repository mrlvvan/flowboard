import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import { Calendar, Tag, CheckSquare, Trash2, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { useUpdateCardMutation, useDeleteCardMutation } from "../api/useCardsQuery";
import type { Card } from "../api/cardsApi";

const LABEL_OPTIONS = [
  { id: "red", color: "bg-red-500" },
  { id: "orange", color: "bg-orange-500" },
  { id: "yellow", color: "bg-yellow-500" },
  { id: "green", color: "bg-green-500" },
  { id: "blue", color: "bg-blue-500" },
  { id: "purple", color: "bg-purple-500" },
];

type ChecklistItem = { id: string; text: string; done: boolean };

function parseChecklist(description: string | null): { text: string; items: ChecklistItem[] } {
  if (!description) return { text: "", items: [] };
  const lines = description.split("\n");
  const items: ChecklistItem[] = [];
  const textLines: string[] = [];

  for (const line of lines) {
    const m = line.match(/^- \[([ x])\] (.+)$/);
    if (m) {
      items.push({ id: crypto.randomUUID(), text: m[2]!, done: m[1] === "x" });
    } else {
      textLines.push(line);
    }
  }
  return { text: textLines.join("\n").trim(), items };
}

function serializeDescription(text: string, items: ChecklistItem[]): string {
  const parts: string[] = [];
  if (text.trim()) parts.push(text.trim());
  if (items.length > 0) {
    parts.push(items.map((i) => `- [${i.done ? "x" : " "}] ${i.text}`).join("\n"));
  }
  return parts.join("\n\n");
}

type Props = {
  card: Card;
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CardModal({ card, boardId, open, onOpenChange }: Props) {
  const { t } = useTranslation("cards");
  const { t: tc } = useTranslation("common");
  const updateMutation = useUpdateCardMutation(boardId);
  const deleteMutation = useDeleteCardMutation(boardId);

  const [title, setTitle] = useState(card.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  const { text: descText, items: checklistItems } = parseChecklist(card.description);
  const [descInput, setDescInput] = useState(descText);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(checklistItems);
  const [newItemText, setNewItemText] = useState("");

  const saveTitle = async () => {
    if (title.trim() && title !== card.title) {
      await updateMutation.mutateAsync({ id: card.id, patch: { title: title.trim() } });
    }
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
    const newItem: ChecklistItem = { id: crypto.randomUUID(), text: newItemText.trim(), done: false };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewItemText("");
    const desc = serializeDescription(descInput, updated);
    await updateMutation.mutateAsync({ id: card.id, patch: { description: desc || null } });
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(card.id);
    onOpenChange(false);
    toast.success(t("deleteCard"));
  };

  const doneCount = checklist.filter((i) => i.done).length;
  const progressPct = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {editingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => void saveTitle()}
              onKeyDown={(e) => { if (e.key === "Enter") void saveTitle(); if (e.key === "Escape") { setTitle(card.title); setEditingTitle(false); } }}
              className="text-lg font-semibold"
              autoFocus
            />
          ) : (
            <DialogTitle
              className="cursor-pointer hover:bg-accent px-1 rounded text-left"
              onClick={() => setEditingTitle(true)}
            >
              {card.title}
            </DialogTitle>
          )}
        </DialogHeader>

        <div className="grid grid-cols-[1fr_auto] gap-6">
          {/* Main content */}
          <div className="space-y-6 min-w-0">
            {/* Description */}
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlignLeft className="h-4 w-4" />
                {t("description")}
              </h3>
              {editingDesc ? (
                <div className="space-y-2">
                  <Textarea
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder={t("descriptionPlaceholder")}
                    rows={5}
                    className="text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void saveDescription()}>{tc("save")}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>{tc("cancel")}</Button>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  className="min-h-[60px] cursor-pointer rounded-md border border-transparent p-2 hover:border-input hover:bg-accent/50"
                  onClick={() => setEditingDesc(true)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setEditingDesc(true); }}
                >
                  {descInput ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{descInput}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("descriptionPlaceholder")}</p>
                  )}
                </div>
              )}
            </section>

            {/* Checklist */}
            {checklist.length > 0 && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckSquare className="h-4 w-4" />
                    {t("checklist")}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {t("progress", { done: doneCount, total: checklist.length })}
                  </span>
                </div>
                <div className="mb-2 h-1.5 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={item.done}
                        onCheckedChange={() => void toggleChecklistItem(item.id)}
                        id={item.id}
                      />
                      <label
                        htmlFor={item.id}
                        className={`flex-1 cursor-pointer text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder={t("checklistItemPlaceholder")}
                    className="text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter") void addChecklistItem(); }}
                  />
                  <Button size="sm" variant="outline" onClick={() => void addChecklistItem()}>
                    {t("addChecklistItem")}
                  </Button>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-36 space-y-4 shrink-0">
            {/* Labels */}
            <div>
              <Label className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                {t("labels")}
              </Label>
              <div className="flex flex-wrap gap-1">
                {LABEL_OPTIONS.map(({ id, color }) => (
                  <button
                    key={id}
                    onClick={() => void toggleLabel(id)}
                    className={`h-5 w-8 rounded-sm ${color} transition-opacity ${card.labels.includes(id) ? "opacity-100 ring-2 ring-offset-1 ring-primary" : "opacity-40 hover:opacity-70"}`}
                    title={t(`labelColors.${id}`)}
                  />
                ))}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {card.labels.map((l) => (
                  <Badge key={l} variant="outline" className="text-xs capitalize">{l}</Badge>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div>
              <Label className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {t("dueDate")}
              </Label>
              <Input
                type="date"
                className="text-xs"
                value={card.due_date ? format(new Date(card.due_date), "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  void updateMutation.mutateAsync({
                    id: card.id,
                    patch: { due_date: e.target.value ? new Date(e.target.value).toISOString() : null },
                  })
                }
              />
            </div>

            {/* Add checklist item */}
            {checklist.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start gap-1 text-xs"
                onClick={() => {
                  const item: ChecklistItem = { id: crypto.randomUUID(), text: "", done: false };
                  setChecklist([item]);
                  setEditingDesc(true);
                }}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                {t("checklist")}
              </Button>
            )}

            <Separator />

            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start gap-1 text-xs text-destructive hover:text-destructive"
              onClick={() => void handleDelete()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("deleteCard")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
