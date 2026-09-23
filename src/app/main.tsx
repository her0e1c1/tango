import "./styles/index.css";
import "@/shared/firebase";
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { AppErrorBoundary } from "./error-boundary";
import { appRoutes } from "./routes";

const router = createBrowserRouter(appRoutes);
const root = document.getElementById("root");
if (root == null) throw new Error("Missing root element");

createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App router={router} />
    </AppErrorBoundary>
  </React.StrictMode>
);
