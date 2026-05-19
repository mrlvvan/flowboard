import { useEffect, useState } from "react";
import { goOnline } from "@/db/syncEngine";
import { pendingCount } from "@/db/syncQueue";

export type SyncStatus = "online" | "offline" | "syncing";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? "online" : "offline");
  const [pendingOps, setPendingOps] = useState(0);

  // Initial pending count — separate effect to avoid setState-in-effect rule
  useEffect(() => {
    pendingCount().then(setPendingOps).catch(() => undefined);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus("syncing");
      void goOnline().then(() =>
        pendingCount().then((n) => {
          setPendingOps(n);
          setSyncStatus("online");
        })
      );
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
