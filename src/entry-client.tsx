import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

const router = getRouter();

// Use hydrateRoot to attach to SSR-rendered HTML without re-rendering
const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.hydrateRoot(
    document,
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}
