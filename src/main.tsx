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

const root = document.getElementById("root");
if (root == null) throw new Error("Missing root element");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistStore(store)}>
          <App />
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
