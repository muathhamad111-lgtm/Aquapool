import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/**
 * Hardcoded rather than derived from the request: `head` is static, and a
 * crawler resolves og:image against nothing — only an absolute URL yields a
 * link preview at all.
 */
const SITE_URL = "https://aqua.moathhamad.space";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-ocean">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aqua Pool Group | تشطيب المسابح وإكسسواراتها" },
      {
        name: "description",
        content:
          "Leaders in luxury pool finishing, accessories, and maintenance across the Middle East.",
      },
      { name: "author", content: "Aqua Pool Group" },
      { property: "og:title", content: "Aqua Pool Group | تشطيب المسابح وإكسسواراتها" },
      {
        property: "og:description",
        content:
          "Leaders in luxury pool finishing, accessories, and maintenance across the Middle East.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Aqua Pool Group | تشطيب المسابح وإكسسواراتها" },
      {
        name: "twitter:description",
        content:
          "Leaders in luxury pool finishing, accessories, and maintenance across the Middle East.",
      },
      // Absolute, because a crawler resolves og:image against nothing —
      // a relative path yields no preview at all. Self-hosted from
      // public/site/: this was previously a Lovable-hosted R2 URL, an
      // external dependency for every page's link preview long after
      // Lovable itself was removed from the project. Same picture, served
      // from our own origin.
      { property: "og:image", content: `${SITE_URL}/site/social-preview.jpg` },
      { name: "twitter:image", content: `${SITE_URL}/site/social-preview.jpg` },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&family=Epilogue:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/dashboard");

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {isAdminArea ? (
          <Outlet />
        ) : (
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
        )}
      </LanguageProvider>
    </QueryClientProvider>
  );
}
