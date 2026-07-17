import "./firebase";
import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "@/App";
import { queryClient } from "@/query/client";
import { AuthProvider } from "@/auth/AuthContext";
import { AuthBootstrap } from "@/auth/AuthBootstrap";

const root = document.getElementById("root");
if (root == null) throw new Error("Missing root element");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthBootstrap />
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
