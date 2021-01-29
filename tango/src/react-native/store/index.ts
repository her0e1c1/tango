import * as Redux from "redux";
import thunk from "redux-thunk";
import { persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { root } from "./reducer";

const logger: Redux.Middleware = () => (next) => (action) => {
  __DEV__ && console.log("ACTION: ", action.type);
  const rv = next(action);
  return rv;
};

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["nav", "deck", "card", "config"],
};

const persistedReducer = persistReducer(persistConfig, root);

const store = Redux.createStore(
  persistedReducer, // Alos need <PersistGate />
  Redux.compose(Redux.applyMiddleware(thunk, logger))
);

export default store;
