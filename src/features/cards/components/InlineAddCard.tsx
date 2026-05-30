import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { I } from "@/shared/ui/icons";
import { useCreateCardMutation } from "../api/useCardsQuery";

type Props = {
  boardId: string;
  columnId: string;
  lastPosition?: string;
  /** When true the form opens immediately (controlled from parent) */
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
};

export function InlineAddCard({
  boardId,
  columnId,
  lastPosition,
  forceOpen,
  onForceOpenHandled,
}: Props) {
  const { t } = useTranslation("cards");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mutation = useCreateCardMutation(boardId);

  // Open when parent triggers it — sync without effect to avoid lint
  if (forceOpen && !open) {
    setOpen(true);
    onForceOpenHandled?.();
  }

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setOpen(false);
      return;
    }
    await mutation.mutateAsync({ columnId, title: trimmed, afterPosition: lastPosition });
    setTitle("");
    // keep open to add more cards quickly
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
    if (e.key === "Escape") {
      setOpen(false);
      setTitle("");
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-0.5 flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-white/40 transition hover:bg-white/[0.04] hover:text-white/85"
      >
        <span className="text-white/35">{I.Plus}</span> {t("addCard")}
      </button>
    );
  }

  return (
    <div className="mt-0.5 space-y-2">
      <textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("cardTitlePlaceholder")}
        rows={2}
        className="fb-input w-full resize-none rounded-xl p-2.5 text-[13px]"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={() => void submit()}
          disabled={mutation.isPending || !title.trim()}
          className="fb-grad-btn h-8 rounded-lg px-3 text-[12.5px] font-medium text-white disabled:opacity-60"
        >
          {mutation.isPending ? t("addingCard") : t("addCardBtn")}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setTitle("");
          }}
          className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/[0.05] hover:text-white"
        >
          {I.X}
        </button>
      </div>
    </div>
  );
}
