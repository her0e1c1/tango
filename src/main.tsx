import "./firebase";
import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "@/App";
import { queryClient } from "@/query/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import store from "@/store";
import { AuthProvider } from "@/auth/AuthContext";
import { AuthBootstrap } from "@/auth/AuthBootstrap";

const root = document.getElementById("root");
if (root == null) throw new Error("Missing root element");
const persistor = persistStore(store);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AuthProvider>
            <AuthBootstrap />
            <App />
          </AuthProvider>
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
