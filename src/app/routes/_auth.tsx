import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/shared/lib/supabase";
import { Sidebar } from "../Sidebar";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }

    return { user: session.user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { user } = Route.useRouteContext();

  return (
    <div className="fb-bg flex h-screen overflow-hidden text-white">
      <Sidebar user={user} />
      <main className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
