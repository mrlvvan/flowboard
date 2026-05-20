import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { I } from "@/shared/ui/icons";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";

export function SyncIndicator() {
  const { syncStatus, pendingOps } = useOnlineStatus();

  const label =
    syncStatus === "offline"
      ? "Offline"
      : syncStatus === "syncing"
        ? `Syncing${pendingOps > 0 ? ` (${pendingOps})` : ""}…`
        : "Synced";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="relative grid h-10 w-10 place-items-center rounded-xl transition hover:bg-white/[0.04]"
          aria-label={label}
        >
          <span className={syncStatus === "offline" ? "text-rose-400" : "text-emerald-400/90"}>
            {I.Cloud}
          </span>
          <span
            className={`absolute right-2 bottom-2 h-1.5 w-1.5 rounded-full ring-2 ring-[#0a0a0f] ${
              syncStatus === "offline"
                ? "bg-rose-400"
                : syncStatus === "syncing"
                  ? "animate-spin bg-amber-400"
                  : "fb-pulse bg-emerald-400"
            }`}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
