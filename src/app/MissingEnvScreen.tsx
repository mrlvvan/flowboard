/**
 * Shown when the build is missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
 * Most commonly seen on a fresh Vercel deploy before the env vars are
 * configured in Project → Settings → Environment Variables.
 */
export function MissingEnvScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 560, width: "100%" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 10px",
            background: "rgba(244, 63, 94, 0.12)",
            color: "#fda4af",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          ⚠ Configuration required
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Missing Supabase environment variables
        </h1>

        <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 24 }}>
          This build can&apos;t connect to a database because <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> aren&apos;t set. Both must be present at build time
          (Vite inlines them into the bundle).
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
            On Vercel
          </div>
          <ol style={{ paddingLeft: 20, color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
            <li>
              Dashboard → your project → <b>Settings → Environment Variables</b>
            </li>
            <li>
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>
            </li>
            <li>
              <b>Redeploy</b> (env vars don&apos;t apply to existing builds)
            </li>
          </ol>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
            Locally
          </div>
          <pre
            style={{
              margin: 0,
              fontSize: 12.5,
              color: "rgba(255,255,255,0.8)",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
            }}
          >
            {`# .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs…`}
          </pre>
        </div>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          Find both values in Supabase Dashboard →{" "}
          <b style={{ color: "rgba(255,255,255,0.6)" }}>Settings → API</b>.
        </p>
      </div>
    </div>
  );
}
