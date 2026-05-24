import { useEffect, useRef, useState } from "react";
import { goOnline } from "@/db/syncEngine";
import { pendingCount } from "@/db/syncQueue";

export type SyncStatus = "online" | "offline" | "syncing";

/** Poll interval (ms) while offline to keep the pending-ops counter fresh */
const OFFLINE_POLL_MS = 3_000;

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? "online" : "offline");
  const [pendingOps, setPendingOps] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refresh the pending count
  const refreshPending = () => {
    pendingCount()
      .then(setPendingOps)
      .catch(() => undefined);
  };

  // Initial count
  useEffect(() => {
    refreshPending();
  }, []);

  // Start/stop polling when offline
  useEffect(() => {
    if (!isOnline) {
      pollRef.current = setInterval(refreshPending, OFFLINE_POLL_MS);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus("syncing");
      void goOnline()
        .then(() => pendingCount())
        .then((n) => {
          setPendingOps(n);
          setSyncStatus("online");
        })
        .catch(() => setSyncStatus("online"));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, syncStatus, pendingOps };
}
