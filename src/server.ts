// Polyfill window & document for SSR node environment before loading leaflet / react-leaflet modules
if (typeof globalThis.window === "undefined") {
  const dummyEl = { setAttribute: () => {}, style: {}, appendChild: () => {} };
  (globalThis as any).window = globalThis;
  (globalThis as any).document = {
    createElement: () => dummyEl,
    getElementsByTagName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
    head: dummyEl,
    body: dummyEl,
  };
  (globalThis as any).navigator = { userAgent: "node" };
}

import "./lib/error-capture";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      if (response.status >= 500) {
        try {
          const text = await response.clone().text();
          if (text.includes('"unhandled": true') || text.includes('"status": 500')) {
            console.warn("Intercepted SSR 500 error response, bypassing swallow");
          }
        } catch {
          // ignore clone error
        }
      }
      return response;
    } catch (error) {
      console.warn("SSR Server Entry warning:", error);
      const handler = await getServerEntry();
      return await handler.fetch(request, env, ctx);
    }
  },
};
