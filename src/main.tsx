/**
 * @file Starts the React application in the browser.
 * It creates the root providers, enables development diagnostics, and mounts the route tree into
 * the HTML page.
 */

import "./firebase";
import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { AuthProvider } from "@/auth/AuthContext";
import { AuthBootstrap } from "@/auth/AuthBootstrap";

const root = document.getElementById("root");
if (root == null) throw new Error("Missing root element");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthBootstrap />
      <App />
    </AuthProvider>
  </React.StrictMode>
);
