/**
 * Returns true if the error looks like a network/connectivity problem
 * rather than a server-side or auth error.
 */
export function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return (
    msg === "Failed to fetch" ||
    msg.includes("NetworkError") ||
    msg.includes("network") ||
    msg.includes("ERR_INTERNET_DISCONNECTED") ||
    !navigator.onLine
  );
}
