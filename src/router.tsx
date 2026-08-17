import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

let routerInstance: ReturnType<typeof createRouter> | null = null;
let queryClientInstance: QueryClient | null = null;

export const getRouter = () => {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          retry: 1,
        },
      },
    });
  }

  if (!routerInstance) {
    routerInstance = createRouter({
      routeTree,
      context: { queryClient: queryClientInstance },
      scrollRestoration: true,
      defaultPreload: false,
      defaultPreloadStaleTime: 1000 * 60 * 5,
    });
  }

  return routerInstance;
};
