import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { useCreateCardMutation } from "../api/useCardsQuery";

type Props = {
  boardId: string;
  columnId: string;
  lastPosition?: string;
};

export function InlineAddCard({ boardId, columnId, lastPosition }: Props) {
  const { t } = useTranslation("cards");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mutation = useCreateCardMutation(boardId);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await mutation.mutateAsync({ columnId, title: trimmed, afterPosition: lastPosition });
    setTitle("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
    if (e.key === "Escape") setOpen(false);
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-1 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {t("addCard")}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("cardTitlePlaceholder")}
        rows={2}
        className="resize-none text-sm"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => void submit()} disabled={mutation.isPending}>
          {t("addCard")}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => { setOpen(false); setTitle(""); }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
