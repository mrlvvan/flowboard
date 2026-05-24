import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className="flex h-screen items-center justify-center p-6 text-white"
        style={{ background: "#0a0a0f" }}
      >
        <div className="w-full max-w-[440px] text-center">
          <div
            className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: "rgba(244,63,94,0.1)", color: "#fb7185" }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 className="mb-2 text-[22px] font-semibold tracking-tight">Something went wrong</h1>
          <p className="mb-5 text-[13.5px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            An unexpected error occurred.
          </p>

          <div
            className="mb-5 rounded-xl px-4 py-3 text-left"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="font-mono text-[12px] break-all" style={{ color: "#fca5a5" }}>
              {error.message}
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="fb-grad-btn h-9 rounded-xl px-5 text-[13.5px] font-semibold text-white"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              className="h-9 rounded-xl px-5 text-[13.5px] transition hover:text-white"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
