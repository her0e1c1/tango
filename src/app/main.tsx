/**
 * @file Starts the React application in the browser.
 * It creates the root providers, enables development diagnostics, and mounts the route tree into
 * the HTML page.
 */

import "@/shared/api/firebase";
import "./styles/index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = document.getElementById("root");
if (root == null) throw new Error("Missing root element");

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
