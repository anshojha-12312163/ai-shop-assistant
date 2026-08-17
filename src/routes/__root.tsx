import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { CartProvider } from "@/lib/cart";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl italic text-accent">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background transition-colors hover:bg-accent"
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
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Synthetix AI Assistant
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {error?.message
            ? error.message
            : "Connection refresh required. Tap below to launch the marketplace."}
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background hover:bg-accent transition-colors cursor-pointer"
          >
            Refresh & Launch Marketplace
          </button>
          <a
            href="/"
            className="rounded-full border border-border bg-secondary px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-border transition-colors cursor-pointer"
          >
            Go Home
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
      { title: "Synthetix — The marketplace that shops with you" },
      {
        name: "description",
        content:
          "AI-mediated marketplace. Discover with conversation, sell with a co-pilot. Curated goods from independent makers.",
      },
      { property: "og:title", content: "Synthetix — AI-powered marketplace" },
      {
        property: "og:description",
        content:
          "Find exactly what you actually mean. Conversational discovery, explainable recommendations, and an AI co-pilot for sellers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap",
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
    <html lang="en">
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

  useEffect(() => {
    // Clean OAuth hash fragments (#access_token=...) on OAuth redirect return
    if (typeof window !== "undefined" && window.location.hash.includes("access_token=")) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          window.history.replaceState(null, "", "/discover");
        }
      });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        if (typeof window !== "undefined" && window.location.hash.includes("access_token=")) {
          window.history.replaceState(null, "", "/discover");
        }
      }
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Outlet />
        <Toaster
          position="top-center"
          theme="light"
          toastOptions={{ style: { fontFamily: "var(--font-sans)" } }}
        />
      </CartProvider>
    </QueryClientProvider>
  );
}
