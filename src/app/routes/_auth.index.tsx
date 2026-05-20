import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I } from "@/shared/ui/icons";
import { BoardsGrid, CreateBoardDialog } from "@/features/boards";

export const Route = createFileRoute("/_auth/")({
  component: BoardsPage,
});

function BoardsPage() {
  const { t } = useTranslation("boards");
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<"All" | "Starred" | "Recent" | "Archived">("All");

  return (
    <div className="flex h-full flex-col overflow-hidden text-white">
      {/* Page header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.04] px-8">
        <div>
          <div className="text-[11px] font-medium tracking-[0.14em] text-white/40 uppercase">
            Workspace
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <h1 className="text-[18px] font-semibold tracking-tight">Acme Studio</h1>
            <span className="text-white/30">{I.ChevronDown}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/35">
              {I.Search}
            </span>
            <input
              placeholder="Search boards, cards, members…"
              className="fb-input h-9 w-72 rounded-lg pr-10 pl-9 text-[13px]"
            />
            <kbd className="absolute top-1/2 right-2 -translate-y-1/2 rounded border border-white/[0.06] bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-white/40">
              ⌘K
            </kbd>
          </div>
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
            <p className="mt-1 text-[13.5px] text-white/50">Synced just now</p>
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

        <BoardsGrid onCreateBoard={() => setCreateOpen(true)} />
      </div>

      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
