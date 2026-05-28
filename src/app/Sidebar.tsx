import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { User } from "@supabase/supabase-js";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { I } from "@/shared/ui/icons";
import { SyncIndicator } from "./SyncIndicator";
import { CreateBoardDialog } from "@/features/boards";
import { signOut } from "@/features/auth";
import { useInstallPrompt } from "@/shared/hooks/useInstallPrompt";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import { SearchDialog } from "@/features/search/SearchDialog";
import { useUIStore } from "@/shared/store/uiStore";
import { useCommandHistory } from "@/shared/commands/commandHistory";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

type Props = { user: User };

function initials(name?: string | null, email?: string) {
  if (name) return name.slice(0, 2).toUpperCase();
  return (email ?? "?").slice(0, 2).toUpperCase();
}

/** Single icon-button in the sidebar */
function SidebarBtn({
  children,
  active = false,
  badge = false,
  tip,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  badge?: boolean;
  tip?: string;
  onClick?: () => void;
}) {
  const btn = (
    <button
      onClick={onClick}
      className={`relative grid h-10 w-10 place-items-center rounded-xl transition-all ${
        active
          ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "text-white/45 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {active && (
        <span className="absolute top-1/2 -left-[10px] h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500" />
      )}
      {children}
      {badge && (
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-violet-400" />
      )}
    </button>
  );

  if (!tip) return btn;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent side="right">{tip}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({ user }: Props) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { i18n } = useTranslation();

  const [createOpen, setCreateOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { searchOpen, setSearchOpen } = useUIStore();
  const { canInstall, install } = useInstallPrompt();
  const undo = useCommandHistory((s) => s.undo);
  const redo = useCommandHistory((s) => s.redo);

  const toggleLanguage = () => {
    void i18n.changeLanguage(i18n.language === "en" ? "ru" : "en");
  };

  useKeyboardShortcuts({
    "/": () => setSearchOpen(true),
    "ctrl+k": () => setSearchOpen(true),
    "meta+k": () => setSearchOpen(true),
    n: () => setCreateOpen(true),
    "?": () => setShortcutsOpen(true),
    "ctrl+z": () => void undo(),
    "meta+z": () => void undo(),
    "ctrl+shift+z": () => void redo(),
    "meta+shift+z": () => void redo(),
  });

  const fullName = user.user_metadata["full_name"] as string | undefined;
  const userInitials = initials(fullName, user.email);

  // Route-aware active detection
  const isBoards = pathname === "/" || pathname === "";
  const isBoardPage = pathname.startsWith("/board/");

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/login" });
  };

  return (
    <>
      <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-white/[0.05] bg-black/30 py-4">
        {/* Logo */}
        <Link to="/" className="mb-3">
          <I.Logo size={28} />
        </Link>

        {/* Nav icons */}
        <SidebarBtn tip="Search (/ or Ctrl+K)" onClick={() => setSearchOpen(true)}>
          {I.Search}
        </SidebarBtn>

        <SidebarBtn active={isBoards} tip="Boards">
          <Link to="/" className="grid h-full w-full place-items-center">
            <I.Logo size={16} />
          </Link>
        </SidebarBtn>

        <SidebarBtn active={isBoardPage} tip="All boards">
          {I.Grid}
        </SidebarBtn>

        <SidebarBtn tip="Starred boards">{I.Star}</SidebarBtn>

        {/* New board */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCreateOpen(true)}
              className="fb-grad-btn mt-1 grid h-10 w-10 place-items-center rounded-xl text-white"
            >
              {I.Plus}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">New board (N)</TooltipContent>
        </Tooltip>

        {/* Bottom section */}
        <div className="mt-auto flex flex-col items-center gap-1">
          {/* Sync indicator */}
          <SyncIndicator />

          {/* Notifications */}
          <SidebarBtn badge tip="Notifications">
            {I.Bell}
          </SidebarBtn>

          {/* Install PWA */}
          {canInstall && (
            <SidebarBtn tip="Install app" onClick={() => void install()}>
              {I.Cloud}
            </SidebarBtn>
          )}

          {/* Language toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleLanguage}
                className="grid h-8 w-8 place-items-center rounded-lg text-[10px] font-bold text-white/45 transition hover:bg-white/[0.05] hover:text-white"
              >
                {i18n.language === "ru" ? "RU" : "EN"}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Switch to {i18n.language === "ru" ? "English" : "Russian"}
            </TooltipContent>
          </Tooltip>

          {/* Help / keyboard shortcuts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShortcutsOpen(true)}
                className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Keyboard shortcuts"
              >
                <span className="text-[13px] font-bold">?</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Keyboard shortcuts (?)</TooltipContent>
          </Tooltip>

          {/* User avatar / menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="User menu"
                className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white ring-2 ring-[#0c0c14] transition-all hover:ring-violet-400/40"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
              >
                {userInitials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              className="w-48 border-white/10 bg-[#13131f] text-white"
            >
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{fullName ?? "User"}</p>
                <p className="truncate text-xs text-white/45">{user.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="cursor-pointer text-rose-300 focus:bg-rose-500/10 focus:text-rose-200"
                onClick={() => void handleSignOut()}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}
