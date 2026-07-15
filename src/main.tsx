import "./firebase";
import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "@src/App";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import store from "@src/store";

const root = document.getElementById("root");
if (root == null) throw new Error("Missing root element");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistStore(store)}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
