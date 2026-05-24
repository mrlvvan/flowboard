import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { I } from "@/shared/ui/icons";
import { BoardsGrid, CreateBoardDialog } from "@/features/boards";
import { useBoardsQuery } from "@/features/boards/api/useBoardsQuery";
import { useUIStore } from "@/shared/store/uiStore";
import { Route as AuthRoute } from "./_auth";
import { DbSetupBanner } from "@/features/boards/components/DbSetupBanner";

export const Route = createFileRoute("/_auth/")({
  component: BoardsPage,
});

type Tab = "All" | "Starred" | "Recent" | "Archived";

function isDbMissingError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "unknown error";
  return msg.includes("relation") && msg.includes("does not exist");
}

function BoardsPage() {
  const { t } = useTranslation("boards");
  const { user } = AuthRoute.useRouteContext();
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("All");

  // Fetch active and archived boards in parallel
  const activeQuery = useBoardsQuery(false);
  const archivedQuery = useBoardsQuery(true);

  const filteredBoards = useMemo(() => {
    const active = activeQuery.data ?? [];
    const archived = archivedQuery.data ?? [];

    switch (tab) {
      case "All":
        return active;
      case "Starred":
        return active.filter((b) => b.is_starred);
      case "Recent":
        // Last 6 boards by updated_at
        return [...active]
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 6);
      case "Archived":
        return archived;
    }
  }, [tab, activeQuery.data, archivedQuery.data]);

  const isLoading = tab === "Archived" ? archivedQuery.isLoading : activeQuery.isLoading;
  const isError = tab === "Archived" ? archivedQuery.isError : activeQuery.isError;
  const refetch =
    tab === "Archived" ? () => void archivedQuery.refetch() : () => void activeQuery.refetch();

  const workspaceName =
    (user.user_metadata["full_name"] as string | undefined) ??
    user.email?.split("@")[0] ??
    "My workspace";

  return (
    <div className="flex h-full flex-col overflow-hidden text-white">
      {/* Page header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.04] px-8">
        <div>
          <div className="text-[11px] font-medium tracking-[0.14em] text-white/40 uppercase">
            Workspace
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <h1 className="text-[18px] font-semibold tracking-tight">{workspaceName}</h1>
            <span className="text-white/30">{I.ChevronDown}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Search bar — click to open SearchDialog */}
          <button
            onClick={() => setSearchOpen(true)}
            className="relative flex h-9 w-72 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/30 px-3 text-[13px] text-white/35 transition hover:border-white/[0.14] hover:text-white/50"
          >
            <span className="shrink-0">{I.Search}</span>
            <span className="flex-1 text-left">Search boards, cards, members…</span>
            <kbd className="shrink-0 rounded border border-white/[0.06] bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-white/40">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="fb-grad-btn flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-white"
          >
            {I.Plus} {t("newBoard")}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="fb-scroll flex-1 overflow-y-auto px-8 py-7">
        {/* Hero strip */}
        <div className="mb-7 flex items-end justify-between">
          <div>
            <h2 className="text-[26px] font-semibold tracking-tight">{t("title")}</h2>
            <p className="mt-1 text-[13.5px] text-white/50">
              {filteredBoards.length} board{filteredBoards.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-black/30 p-1">
            {(["All", "Starred", "Recent", "Archived"] as const).map((label) => (
              <button
                key={label}
                onClick={() => setTab(label)}
                className={`h-7 rounded-md px-3 text-[12.5px] font-medium transition ${
                  tab === label ? "bg-white/[0.08] text-white" : "text-white/50 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Show DB setup banner if queries fail with "relation does not exist" */}
        <DbSetupBanner error={activeQuery.error} />

        <BoardsGrid
          onCreateBoard={() => setCreateOpen(true)}
          boards={filteredBoards}
          isLoading={isLoading}
          isError={isError && !isDbMissingError(activeQuery.error)}
          onRetry={refetch}
        />
      </div>

      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
