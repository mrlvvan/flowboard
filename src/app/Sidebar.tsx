import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Plus, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Separator } from "@/shared/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CreateBoardDialog } from "@/features/boards";
import { signOut } from "@/features/auth";

type Props = { user: User };

function initials(name?: string | null, email?: string) {
  if (name) return name.slice(0, 2).toUpperCase();
  return (email ?? "?").slice(0, 2).toUpperCase();
}

export function Sidebar({ user }: Props) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const fullName = user.user_metadata["full_name"] as string | undefined;
  const avatarUrl = user.user_metadata["avatar_url"] as string | undefined;

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/login" });
  };

  return (
    <>
      <aside className="flex h-screen w-14 flex-col items-center gap-2 border-r bg-card py-3">
        {/* Logo */}
        <Link to="/" className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          FB
        </Link>

        <Separator className="w-8" />

        {/* New board */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCreateOpen(true)}
              aria-label="New board"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">New board</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        {/* Theme & Language */}
        <ThemeSwitcher />
        <LanguageSwitcher />

        <Separator className="w-8" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="User menu">
              <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent transition-all hover:ring-primary">
                <AvatarImage src={avatarUrl} alt={fullName ?? user.email} />
                <AvatarFallback className="text-xs">
                  {initials(fullName, user.email)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{fullName ?? "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => void handleSignOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
