/**
 * Friendly toast text for Supabase / PostgREST errors.
 * Recognises common failure modes (missing tables, RLS, FK, network) and
 * gives an actionable next step instead of an opaque "{}" or stack trace.
 */
export function formatSupabaseError(err: unknown, action: string): string {
  if (!err) return `${action}: unknown error`;

  // PostgREST returns objects with { code, message, details, hint }
  const e = err as { code?: string; message?: string; details?: string; hint?: string };
  const msg = e.message ?? (err instanceof Error ? err.message : JSON.stringify(err));

  // Missing table — SETUP.sql not run
  if (e.code === "42P01" || msg.includes("relation") || msg.includes("does not exist")) {
    return `Database tables missing. Run supabase/SETUP.sql in Supabase SQL Editor.`;
  }

  // RLS violation
  if (e.code === "42501" || msg.includes("row-level security") || msg.includes("policy")) {
    return `${action}: permission denied (RLS). Re-run SETUP.sql — your profile or board policies may be missing.`;
  }

  // Foreign key — usually missing profile
  if (e.code === "23503" || msg.includes("foreign key")) {
    return `${action}: missing related row. Your profile may not exist — re-run SETUP.sql to backfill profiles.`;
  }

  // Unique constraint
  if (e.code === "23505") {
    return `${action}: duplicate (already exists).`;
  }

  // Auth / network
  if (msg === "Failed to fetch" || msg.includes("NetworkError")) {
    return `${action}: network error. Check VITE_SUPABASE_URL in .env.local.`;
  }
  if (msg.includes("JWT") || msg.includes("Invalid API key")) {
    return `${action}: bad auth. Check VITE_SUPABASE_ANON_KEY in .env.local.`;
  }

  return `${action}: ${msg}`;
}
