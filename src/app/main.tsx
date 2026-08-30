/**
 * @file Starts the React application in the browser.
 * It creates the root error boundary and providers, enables development diagnostics, and mounts
 * the route tree into the HTML page.
 */

import "@/shared/firebase";
import "./styles/index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router-dom";
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
