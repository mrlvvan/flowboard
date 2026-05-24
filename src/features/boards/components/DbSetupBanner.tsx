/**
 * Shown when Supabase tables don't exist yet.
 * Guides the user to run the migration SQL.
 */

const MIGRATION_URL = "https://supabase.com/dashboard/project/_/sql/new";

type Props = { error: unknown };

export function DbSetupBanner({ error }: Props) {
  if (!error) return null;
  const msg =
    error instanceof Error ? error.message : typeof error === "string" ? error : "unknown error";
  if (!msg.includes("relation") || !msg.includes("does not exist")) return null;

  return (
    <div
      className="mb-8 overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/[0.06]"
      style={{ boxShadow: "0 0 40px -10px rgba(245,158,11,0.15)" }}
    >
      {/* Top accent */}
      <div className="h-[3px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />

      <div className="px-6 py-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold text-amber-300">Database not configured</h3>
        </div>

        <p className="mb-4 text-[13.5px] leading-relaxed text-white/65">
          Supabase tables don&apos;t exist yet. You need to run the migration SQL once in the
          Supabase SQL Editor.
        </p>

        <div className="mb-4 rounded-xl border border-white/[0.07] bg-black/40 p-4">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.1em] text-white/40 uppercase">
            Steps to fix:
          </p>
          <ol className="space-y-1.5 text-[13px] text-white/70">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-violet-500/30 text-[10px] font-bold text-violet-300">
                1
              </span>
              Open your Supabase project → <strong className="text-white/90">SQL Editor</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-violet-500/30 text-[10px] font-bold text-violet-300">
                2
              </span>
              Copy the contents of{" "}
              <code className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[11.5px] text-violet-300">
                supabase/migrations/20260524000001_setup_complete.sql
              </code>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-violet-500/30 text-[10px] font-bold text-violet-300">
                3
              </span>
              Paste it in the SQL Editor and click <strong className="text-white/90">Run</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-violet-500/30 text-[10px] font-bold text-violet-300">
                4
              </span>
              Refresh this page
            </li>
          </ol>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={MIGRATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="fb-grad-btn inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-white"
          >
            Open Supabase SQL Editor ↗
          </a>
          <button
            onClick={() => window.location.reload()}
            className="h-9 rounded-lg px-4 text-[13px] text-white/55 transition hover:bg-white/[0.05] hover:text-white"
          >
            Refresh page
          </button>
        </div>
      </div>
    </div>
  );
}
