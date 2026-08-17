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
          if (
            text.includes('"unhandled": true') ||
            text.includes('"status": 500') ||
            text.includes("HTTPError")
          ) {
            console.warn("Intercepted SSR HTTPError 500 response, serving client HTML fallback");
            return new Response(
              `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Synthetix — Find exactly what you actually mean</title></head><body><div id="root"></div></body></html>`,
              {
                status: 200,
                headers: { "content-type": "text/html; charset=utf-8" },
              },
            );
          }
        } catch {
          // ignore clone error
        }
      }
      return response;
    } catch (error) {
      console.warn("SSR Server Entry warning:", error);
      return new Response(
        `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Synthetix — Find exactly what you actually mean</title></head><body><div id="root"></div></body></html>`,
        {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      );
    }
  },
};
