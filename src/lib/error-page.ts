export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Synthetix AI Marketplace</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script>
      // Auto-launch marketplace on cold container wake-up
      if (typeof window !== "undefined") {
        window.location.replace(window.location.pathname + (window.location.search || ""));
      }
    </script>
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; background: rgba(30,41,59,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; backdrop-filter: blur(12px); }
      h1 { font-size: 1.5rem; font-weight: 800; margin: 0 0 0.5rem; color: #38bdf8; }
      p { color: #94a3b8; margin: 0 0 1.5rem; font-size: 0.875rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.625rem 1.25rem; border-radius: 9999px; font-weight: 700; font-size: 0.875rem; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: all 0.2s; }
      .primary { background: #38bdf8; color: #0f172a; }
      .primary:hover { background: #0284c7; color: #fff; }
      .secondary { background: #1e293b; color: #f8fafc; border-color: #334155; }
      .secondary:hover { background: #334155; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Synthetix AI Assistant</h1>
      <p>Launching marketplace connection...</p>
      <div class="actions">
        <button class="primary" onclick="window.location.reload()">Launch Marketplace</button>
        <a class="secondary" href="/">Go Home</a>
      </div>
    </div>
  </body>
</html>`;
}
