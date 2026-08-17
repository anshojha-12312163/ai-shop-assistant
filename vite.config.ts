import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    preset: "vercel",
    errorHandler: "src/lib/nitro-error.ts",
  },
  vite: {
    ssr: {
      noExternal: ["@react-leaflet/core", "react-leaflet", "leaflet"],
    },
  },
});