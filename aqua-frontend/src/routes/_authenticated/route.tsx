import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { hasToken, me } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (!hasToken()) {
      throw redirect({ to: "/admin" });
    }
    const user = await me();
    if (!user) {
      throw redirect({ to: "/admin" });
    }
    return { user };
  },
  component: () => <Outlet />,
});
