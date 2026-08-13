/**
 * @file Starts the React application in the browser.
 * It creates the root providers, enables development diagnostics, and mounts the route tree into
 * the HTML page.
 */

import "@/shared/firebase";
import "./styles/index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { waitForFirestoreInitialization } from "@/shared/firestore";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import App from "./App";
import { AppProviders } from "./providers/AppProviders";

const root = document.getElementById("root");
if (root == null) throw new Error("Missing root element");

void waitForFirestoreInitialization().then((initialization) => {
  createRoot(root).render(
    initialization.status === "blocked" ? (
      <RouteFeedback
        title="Offline storage is unavailable."
        description="Close other tabs or use a supported browser, then reload this page."
        tone="error"
        primaryAction={{ label: "Reload", onClick: () => window.location.reload() }}
      />
    ) : (
      <React.StrictMode>
        <AppProviders>
          <App />
        </AppProviders>
      </React.StrictMode>
    )
  );
});
