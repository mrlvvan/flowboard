import { useState, useRef, useEffect } from "react";
import { I } from "@/shared/ui/icons";
import { useCreateCardMutation } from "../api/useCardsQuery";

type Props = {
  boardId: string;
  columnId: string;
  lastPosition?: string;
};

export function InlineAddCard({ boardId, columnId, lastPosition }: Props) {
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
      <button
        onClick={() => setOpen(true)}
        className="mt-0.5 flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-white/40 transition hover:bg-white/[0.04] hover:text-white/85"
      >
        <span className="text-white/35">{I.Plus}</span> Add a card
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
        placeholder="Card title…"
        rows={2}
        className="fb-input w-full resize-none rounded-xl p-2.5 text-[13px]"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={() => void submit()}
          disabled={mutation.isPending}
          className="fb-grad-btn h-8 rounded-lg px-3 text-[12.5px] font-medium text-white disabled:opacity-60"
        >
          Add card
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
