import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { useEffect } from "react";
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
            onClick={() => window.location.reload()}
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
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (window.location.hash.includes("access_token=")) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          window.history.replaceState(null, "", "/discover");
        }
      });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" && window.location.hash.includes("access_token=")) {
        window.history.replaceState(null, "", "/discover");
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
