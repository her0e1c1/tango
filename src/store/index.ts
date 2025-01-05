import * as Redux from "redux";
import thunk from "redux-thunk";
import storage from "redux-persist/lib/storage";
import { persistReducer } from "redux-persist";
import * as type from "src/action/type";
import { deck, card, config, equal } from "src/store/reducer";

const reducers = {
  deck,
  card,
  config,
};

const root = (state: RootState | undefined, action: Action) => {
  if (equal(action, type.clearAll)) {
    state = undefined;
  }
  return Redux.combineReducers(reducers)(state, action);
};

const logger: Redux.Middleware = () => (next) => (action) => {
  process.env.NODE_ENV !== "production" && console.log("ACTION: ", action.type);
  return next(action);
};

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["deck", "card", "config"],
};

const persistedReducer = persistReducer(persistConfig, root);

const store = Redux.createStore(
  persistedReducer, // Alos need <PersistGate />
  Redux.compose(Redux.applyMiddleware(thunk, logger))
);

export default store;
