// Polyfill window & document for SSR node environment before loading leaflet / react-leaflet / sonner modules
if (typeof globalThis.window === "undefined") {
  const dummyEl: any = {
    setAttribute: () => {},
    getAttribute: () => null,
    style: {},
    appendChild: (c: any) => c,
    removeChild: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const dummyDoc: any = {
    createElement: () => dummyEl,
    createElementNS: () => dummyEl,
    createTextNode: () => dummyEl,
    getElementById: () => null,
    getElementsByTagName: () => [dummyEl],
    getElementsByClassName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    head: dummyEl,
    body: dummyEl,
    documentElement: dummyEl,
  };

  const define = (key: string, value: unknown) => {
    try {
      Object.defineProperty(globalThis, key, {
        value,
        writable: true,
        configurable: true,
      });
    } catch {
      // already defined and non-configurable — skip
    }
  };

  define("self", globalThis);
  define("window", globalThis);
  define("document", dummyDoc);
  define("navigator", { userAgent: "node" });
  define("location", { href: "http://localhost:8080/", pathname: "/", search: "", hash: "" });
  define("getComputedStyle", () => ({
    getPropertyValue: () => "",
    direction: "ltr",
  }));
  define("matchMedia", () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
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

const clientHtmlFallback = `<!doctype html>
<html lang="en">
  <head>
    <script type="module">
      import RefreshRuntime from "/@react-refresh";
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="/@vite/client"></script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Synthetix — Find exactly what you actually mean</title>
    <meta name="description" content="AI-mediated marketplace with conversational discovery, Google Lens visual search, and local store matching." />
    <link rel="icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/src/styles.css?direct" />
  </head>
  <body class="bg-background text-foreground antialiased selection:bg-accent/30">
    <div id="root"></div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;

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
            return new Response(clientHtmlFallback, {
              status: 200,
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }
        } catch {
          // ignore clone error
        }
      }
      return response;
    } catch (error) {
      console.warn("SSR Server Entry warning:", error);
      return new Response(clientHtmlFallback, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

