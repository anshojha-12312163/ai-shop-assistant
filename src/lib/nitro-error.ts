export default function nitroErrorHandler(error: any, event: any) {
  console.warn("Nitro SSR error handled gracefully:", error?.message || error);
  try {
    event.node.res.statusCode = 200;
    event.node.res.setHeader("content-type", "text/html; charset=utf-8");
    event.node.res.end(
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Synthetix — Find exactly what you actually mean</title></head><body><div id="root"></div></body></html>`,
    );
  } catch {
    // Fallback if headers already sent
  }
}
