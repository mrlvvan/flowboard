import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { ErrorBoundary } from "../ErrorBoundary";
import { I } from "@/shared/ui/icons";

function NotFound() {
  return (
    <div
      className="flex h-screen items-center justify-center p-6 text-white"
      style={{ background: "#0a0a0f" }}
    >
      {/* Grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative text-center">
        {/* Glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(400px 200px at 50% 50%, rgba(99,102,241,0.8), transparent 70%)",
          }}
        />

        <div className="mb-4 text-[80px] leading-none font-black tracking-tighter text-white/10 select-none">
          404
        </div>
        <div
          className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl"
          style={{
            background: "rgba(99,102,241,0.1)",
            boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.2)",
          }}
        >
          {I.Back}
        </div>
        <h1 className="mb-2 text-[22px] font-semibold tracking-tight">Page not found</h1>
        <p className="mb-6 text-[14px] text-white/50">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          to="/"
          className="fb-grad-btn inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[14px] font-semibold text-white"
        >
          {I.Back} Back to boards
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  ),
  notFoundComponent: NotFound,
});
