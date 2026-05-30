import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/shared/lib/supabase";
import { boardKeys } from "@/features/boards/api/keys";
import { KanbanBoard } from "@/features/columns/components/KanbanBoard";
import { I } from "@/shared/ui/icons";
import { useBoardChannel } from "@/features/realtime/useBoardChannel";
import { PresenceAvatars } from "@/features/realtime/PresenceAvatars";
import { ShareBoardDialog } from "@/features/realtime/ShareBoardDialog";
import { pullColumnsAndCards } from "@/db/syncEngine";
import { toast } from "sonner";

// ── Filter types ──────────────────────────────────────────────────────────────
const ALL_LABELS = [
  "red",
  "orange",
  "amber",
  "yellow",
  "green",
  "emerald",
  "cyan",
  "blue",
  "indigo",
  "violet",
  "purple",
  "pink",
] as const;
type LabelName = (typeof ALL_LABELS)[number];

const LABEL_HEX: Record<LabelName, string> = {
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

interface BoardSearch {
  labels?: LabelName[];
  overdue?: boolean;
  dueSoon?: boolean;
}

export const Route = createFileRoute("/_auth/board/$boardId")({
  validateSearch: (search: Record<string, unknown>): BoardSearch => ({
    labels: Array.isArray(search["labels"])
      ? (search["labels"] as string[]).filter((l): l is LabelName =>
          ALL_LABELS.includes(l as LabelName)
        )
      : undefined,
    overdue: search["overdue"] === true || search["overdue"] === "true",
    dueSoon: search["dueSoon"] === true || search["dueSoon"] === "true",
  }),
  component: BoardPage,
});

// ── Filter panel ──────────────────────────────────────────────────────────────
function FilterPanel({
  activeLabels,
  overdue,
  dueSoon,
  onToggleLabel,
  onToggleOverdue,
  onToggleDueSoon,
  onClear,
}: {
  activeLabels: LabelName[];
  overdue: boolean;
  dueSoon: boolean;
  onToggleLabel: (l: LabelName) => void;
  onToggleOverdue: () => void;
  onToggleDueSoon: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation("cards");
  const hasFilters = activeLabels.length > 0 || overdue || dueSoon;
  return (
    <div
      className="absolute top-full right-0 z-50 mt-1.5 w-[280px] rounded-2xl border border-white/[0.08] bg-[#111118] p-4 shadow-2xl"
      style={{ boxShadow: "0 24px 60px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.08)" }}
    >
      {/* Labels */}
      <div className="mb-4">
        <div className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-white/45 uppercase">
          {t("filterLabels")}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_LABELS.map((label) => {
            const hex = LABEL_HEX[label];
            const on = activeLabels.includes(label);
            return (
              <button
                key={label}
                onClick={() => onToggleLabel(label)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium transition"
                style={{
                  background: on ? `${hex}22` : "rgba(255,255,255,0.04)",
                  color: on ? hex : "rgba(255,255,255,0.5)",
                  boxShadow: on
                    ? `inset 0 0 0 1px ${hex}44`
                    : "inset 0 0 0 1px rgba(255,255,255,0.06)",
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: on ? hex : "rgba(255,255,255,0.2)" }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Due date */}
      <div className="mb-4">
        <div className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-white/45 uppercase">
          {t("filterDueDate")}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleOverdue}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-medium transition ${
              overdue
                ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30"
                : "bg-white/[0.04] text-white/55 hover:bg-white/[0.07]"
            }`}
          >
            {t("overdue")}
          </button>
          <button
            onClick={onToggleDueSoon}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-medium transition ${
              dueSoon
                ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                : "bg-white/[0.04] text-white/55 hover:bg-white/[0.07]"
            }`}
          >
            {t("dueSoon")}
          </button>
        </div>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={onClear}
          className="w-full rounded-lg py-1.5 text-[12px] text-white/40 transition hover:bg-white/[0.04] hover:text-white/70"
        >
          {t("filterClearAll")}
        </button>
      )}
      {!hasFilters && (
        <p className="text-center text-[11.5px] text-white/25">{t("filterNoActive")}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function BoardPage() {
  const { t } = useTranslation("cards");
  const { t: tc } = useTranslation("common");
  const { boardId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();

  const [shareOpen, setShareOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const filterBtnRef = useRef<HTMLDivElement>(null);

  const activeLabels: LabelName[] = search.labels ?? [];
  const overdueFilter = search.overdue ?? false;
  const dueSoonFilter = search.dueSoon ?? false;
  const filterCount = activeLabels.length + (overdueFilter ? 1 : 0) + (dueSoonFilter ? 1 : 0);

  // Close filter panel on outside click
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  const toggleLabel = (label: LabelName) => {
    const next = activeLabels.includes(label)
      ? activeLabels.filter((l) => l !== label)
      : [...activeLabels, label];
    void navigate({ search: (prev) => ({ ...prev, labels: next.length ? next : undefined }) });
  };

  const toggleOverdue = () => {
    void navigate({ search: (prev) => ({ ...prev, overdue: !overdueFilter || undefined }) });
  };

  const toggleDueSoon = () => {
    void navigate({ search: (prev) => ({ ...prev, dueSoon: !dueSoonFilter || undefined }) });
  };

  const clearFilters = () => {
    void navigate({ search: () => ({}) });
    setFilterOpen(false);
  };

  const startEditingName = () => {
    setNameInput(board?.name ?? "");
    setEditingName(true);
  };

  useBoardChannel(boardId);

  useEffect(() => {
    void pullColumnsAndCards(boardId);
  }, [boardId]);

  const { data: board, isLoading } = useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: async () => {
      const { data, error } = await supabase.from("boards").select("*").eq("id", boardId).single();
      if (error) throw error;
      return data;
    },
  });

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("boards")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", boardId);
      if (error) throw error;
      return name;
    },
    onSuccess: (name) => {
      void qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
      void qc.invalidateQueries({ queryKey: boardKeys.lists() });
      toast.success(`Renamed to "${name}"`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to rename");
    },
  });

  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  const saveName = () => {
    const trimmed = nameInput.trim();
    setEditingName(false);
    if (trimmed && trimmed !== board?.name) {
      void renameMutation.mutateAsync(trimmed);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden text-white">
      {/* Board header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.04] px-7">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/55 transition hover:bg-white/[0.06] hover:text-white"
          >
            {I.Back}
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            {/* Board icon */}
            <div
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, #6366f122, #8b5cf622)",
                boxShadow: "inset 0 0 0 1px #6366f155",
              }}
            >
              <div
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              />
            </div>

            {isLoading ? (
              <div className="h-5 w-40 animate-pulse rounded-md bg-white/[0.06]" />
            ) : editingName ? (
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="w-48 border-b border-violet-400/60 bg-transparent pb-0.5 text-[16px] font-semibold tracking-tight text-white outline-none"
              />
            ) : (
              <button
                onClick={startEditingName}
                title="Click to rename"
                className="group flex items-center gap-1.5 truncate text-[16px] font-semibold tracking-tight text-white transition hover:text-white/80"
              >
                {board?.name ?? "Board"}
                <span className="opacity-0 transition group-hover:opacity-40">{I.Edit}</span>
              </button>
            )}

            <span className="ml-1 shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-white/45">
              {tc("private")}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <PresenceAvatars boardId={boardId} currentUser={user} />
          <div className="h-6 w-px bg-white/[0.06]" />

          {/* Filter button with dropdown */}
          <div ref={filterBtnRef} className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`relative flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] transition ${
                filterCount > 0
                  ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30"
                  : "text-white/65 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {I.Filter} {tc("filter")}
              {filterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white">
                  {filterCount}
                </span>
              )}
            </button>

            {filterOpen && (
              <FilterPanel
                activeLabels={activeLabels}
                overdue={overdueFilter}
                dueSoon={dueSoonFilter}
                onToggleLabel={toggleLabel}
                onToggleOverdue={toggleOverdue}
                onToggleDueSoon={toggleDueSoon}
                onClear={clearFilters}
              />
            )}
          </div>

          <button className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] text-white/65 transition hover:bg-white/[0.05] hover:text-white">
            {I.Eye} {tc("view")}
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="fb-grad-btn flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-white"
          >
            {I.Share} {tc("share")}
          </button>
        </div>
      </header>

      {/* Active filter chips */}
      {filterCount > 0 && (
        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.04] px-7 py-2">
          <span className="text-[11.5px] text-white/40">{t("filteredBy")}</span>
          {activeLabels.map((label) => {
            const hex = LABEL_HEX[label];
            return (
              <button
                key={label}
                onClick={() => toggleLabel(label)}
                className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium transition hover:opacity-70"
                style={{
                  background: `${hex}22`,
                  color: hex,
                  boxShadow: `inset 0 0 0 1px ${hex}33`,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
                {label}
                <span className="ml-0.5 opacity-60">×</span>
              </button>
            );
          })}
          {overdueFilter && (
            <button
              onClick={toggleOverdue}
              className="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[11.5px] font-medium text-rose-300 transition hover:opacity-70"
            >
              {t("overdue")} <span className="opacity-60">×</span>
            </button>
          )}
          {dueSoonFilter && (
            <button
              onClick={toggleDueSoon}
              className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[11.5px] font-medium text-amber-300 transition hover:opacity-70"
            >
              {t("dueSoon")} <span className="opacity-60">×</span>
            </button>
          )}
          <button
            onClick={clearFilters}
            className="ml-1 text-[11px] text-white/30 transition hover:text-white/60"
          >
            {t("filterClearShort")}
          </button>
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          boardId={boardId}
          filterLabels={activeLabels.length ? activeLabels : undefined}
          filterOverdue={overdueFilter || undefined}
          filterDueSoon={dueSoonFilter || undefined}
        />
      </div>

      {board && (
        <ShareBoardDialog
          boardId={boardId}
          boardName={board.name}
          open={shareOpen}
          onOpenChange={setShareOpen}
        />
      )}
    </div>
  );
}
