/**
 * @file Mounts the React application after startup recovery has completed.
 */

import "@/shared/firebase";

import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { AppErrorBoundary } from "./error-boundary";
import { appRoutes } from "./routes";

const root = document.getElementById("root");
if (root == null) throw new Error("Missing root element");
const router = createBrowserRouter(appRoutes);

createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App router={router} />
    </AppErrorBoundary>
  </React.StrictMode>
);

// Register only on a normal startup; a reset must not reinstall the worker it is removing.
registerSW();
