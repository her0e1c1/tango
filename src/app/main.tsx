/**
 * @file Starts the React application in the browser.
 * It creates the root error boundary and providers, enables development diagnostics, and mounts
 * the route tree into the HTML page.
 */

import "@/shared/firebase";
import "./styles/index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./error-boundary";

const root = document.getElementById("root");
if (root == null) throw new Error("Missing root element");

createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
