import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { I } from "@/shared/ui/icons";
import { useAuth } from "@/features/auth";
import {
  useCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} from "../api/useCommentsQuery";
import type { CommentWithAuthor } from "../api/commentsApi";

type Props = { cardId: string; boardId: string };

function initials(name?: string | null, email?: string) {
  if (name) return name.slice(0, 2).toUpperCase();
  return (email ?? "?").slice(0, 2).toUpperCase();
}

// ── A single comment row ──────────────────────────────────────────────────────
function CommentRow({
  comment,
  isOwn,
  onUpdate,
  onDelete,
}: {
  comment: CommentWithAuthor;
  isOwn: boolean;
  onUpdate: (body: string) => void;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation("cards");
  const { t: tc } = useTranslation("common");
  const locale = i18n.language === "ru" ? ru : enUS;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);

  const author = comment.author;
  const name = author?.full_name ?? author?.email?.split("@")[0] ?? "Unknown";
  const initialsText = initials(author?.full_name, author?.email);

  return (
    <div className="group flex gap-3">
      {/* Avatar */}
      <div
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white ring-1 ring-white/[0.08]"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        title={name}
      >
        {initialsText}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[12.5px] font-medium text-white/90">{name}</span>
          <span className="text-[10.5px] text-white/35">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale })}
          </span>
          {comment.created_at !== comment.updated_at && (
            <span className="text-[10.5px] text-white/30 italic">{t("edited")}</span>
          )}
        </div>

        {editing ? (
          <div className="mt-1.5 space-y-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              className="fb-input w-full resize-none rounded-lg p-2 text-[12.5px] leading-relaxed"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  const trimmed = draft.trim();
                  if (trimmed && trimmed !== comment.body) onUpdate(trimmed);
                  setEditing(false);
                }}
                disabled={!draft.trim()}
                className="fb-grad-btn h-7 rounded-md px-2.5 text-[11.5px] font-medium text-white disabled:opacity-60"
              >
                {tc("save")}
              </button>
              <button
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(false);
                }}
                className="h-7 rounded-md px-2.5 text-[11.5px] text-white/55 transition hover:bg-white/[0.05] hover:text-white"
              >
                {tc("cancel")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-0.5 text-[12.5px] leading-relaxed whitespace-pre-wrap text-white/75">
              {comment.body}
            </p>
            {isOwn && (
              <div className="mt-1 flex gap-2 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => setEditing(true)}
                  className="text-[10.5px] text-white/45 hover:text-white/80"
                >
                  {tc("edit")}
                </button>
                <button
                  onClick={onDelete}
                  className="text-[10.5px] text-rose-300/70 hover:text-rose-300"
                >
                  {tc("delete")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export function CardComments({ cardId, boardId }: Props) {
  const { t } = useTranslation("cards");
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useCommentsQuery(cardId);
  const createMutation = useCreateCommentMutation(cardId);
  const updateMutation = useUpdateCommentMutation(cardId);
  const deleteMutation = useDeleteCommentMutation(cardId);

  const [draft, setDraft] = useState("");

  const submit = async () => {
    const body = draft.trim();
    if (!body || !user) return;
    await createMutation.mutateAsync({
      cardId,
      boardId,
      authorId: user.id,
      body,
    });
    setDraft("");
  };

  return (
    <section className="mb-2">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-[12px] font-semibold tracking-[0.12em] text-white/55 uppercase">
          {t("comments")}
        </h3>
        {comments.length > 0 && (
          <span className="rounded-md bg-white/[0.05] px-1.5 py-[1px] text-[10.5px] font-medium text-white/45">
            {comments.length}
          </span>
        )}
      </div>

      {/* New comment composer */}
      {user && (
        <div className="mb-4 flex gap-2.5">
          <div
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white ring-1 ring-white/[0.08]"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            {initials(user.user_metadata["full_name"] as string | undefined, user.email)}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder={t("writeComment")}
              rows={2}
              className="fb-input w-full resize-none rounded-lg p-2.5 text-[12.5px] leading-relaxed"
            />
            {draft.trim() && (
              <button
                onClick={() => void submit()}
                disabled={createMutation.isPending}
                className="fb-grad-btn h-7 rounded-md px-3 text-[11.5px] font-medium text-white disabled:opacity-60"
              >
                {createMutation.isPending ? t("addingCard") : t("postComment")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-white/[0.05]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-white/[0.05]" />
                <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg border border-dashed border-white/[0.06] px-3 py-3 text-[12px] text-white/35">
          <span className="text-white/30">{I.Bell}</span>
          {t("noComments")}
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              isOwn={!!user && comment.author_id === user.id}
              onUpdate={(body) => void updateMutation.mutateAsync({ id: comment.id, body })}
              onDelete={() => void deleteMutation.mutateAsync(comment.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
