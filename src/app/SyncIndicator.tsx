import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";

export function SyncIndicator() {
  const { syncStatus, pendingOps } = useOnlineStatus();

  const icon =
    syncStatus === "offline" ? (
      <WifiOff className="h-4 w-4 text-destructive" />
    ) : syncStatus === "syncing" ? (
      <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
    ) : (
      <Wifi className="h-4 w-4 text-green-500" />
    );

  const label =
    syncStatus === "offline"
      ? "Offline"
      : syncStatus === "syncing"
        ? `Syncing${pendingOps > 0 ? ` (${pendingOps})` : ""}…`
        : "Online";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            syncStatus === "offline" && "bg-destructive/10"
          )}
          aria-label={label}
        >
          {icon}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
