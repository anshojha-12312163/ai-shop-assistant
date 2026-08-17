import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const publicDir = path.join(root, "public");
const clientAssetsDir = path.join(distDir, "client", "assets");
const targetAssetsDir = path.join(distDir, "assets");

if (!fs.existsSync(targetAssetsDir)) {
  fs.mkdirSync(targetAssetsDir, { recursive: true });
}

// Copy public assets (e.g. favicon.ico) to dist root and dist/client root
if (fs.existsSync(publicDir)) {
  const publicFiles = fs.readdirSync(publicDir);
  for (const file of publicFiles) {
    const srcPath = path.join(publicDir, file);
    fs.copyFileSync(srcPath, path.join(distDir, file));
    const distClientDir = path.join(distDir, "client");
    if (fs.existsSync(distClientDir)) {
      fs.copyFileSync(srcPath, path.join(distClientDir, file));
    }
  }
}

let indexJsFile = "";
let styleCssFile = "";

if (fs.existsSync(clientAssetsDir)) {
  const files = fs.readdirSync(clientAssetsDir);
  for (const file of files) {
    const srcPath = path.join(clientAssetsDir, file);
    const destPath = path.join(targetAssetsDir, file);
    fs.copyFileSync(srcPath, destPath);

    if (file.startsWith("index-") && file.endsWith(".js")) {
      indexJsFile = file;
    }
    if (file.startsWith("styles-") && file.endsWith(".css")) {
      styleCssFile = file;
    }
  }
}

if (!indexJsFile) {
  console.warn("No index-*.js found in client assets, checking dist/assets...");
  if (fs.existsSync(targetAssetsDir)) {
    const files = fs.readdirSync(targetAssetsDir);
    for (const file of files) {
      if (file.startsWith("index-") && file.endsWith(".js")) {
        indexJsFile = file;
      }
      if (file.startsWith("styles-") && file.endsWith(".css")) {
        styleCssFile = file;
      }
    }
  }
}

const htmlContent = `<!doctype html>
<html lang="en">
  <head>
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
    ${styleCssFile ? `<link rel="stylesheet" href="/assets/${styleCssFile}" />` : ""}
    ${indexJsFile ? `<script type="module" src="/assets/${indexJsFile}"></script>` : ""}
  </head>
  <body class="bg-background text-foreground antialiased selection:bg-accent/30">
    <div id="root"></div>
  </body>
</html>`;

fs.writeFileSync(path.join(distDir, "index.html"), htmlContent, "utf-8");

const distClientDir = path.join(distDir, "client");
if (fs.existsSync(distClientDir)) {
  fs.writeFileSync(path.join(distClientDir, "index.html"), htmlContent, "utf-8");
}

console.log("Postbuild static index.html generated successfully!");
console.log("JS Entry:", indexJsFile);
console.log("CSS Entry:", styleCssFile);
