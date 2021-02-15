import * as Redux from "redux";
import * as type from "src/action/type";
import { deck, card, config, download, equal } from "src/store/reducer";

const reducers = {
  deck,
  card,
  download,
  config,
};

export const root = (state: RootState | undefined, action: Action) => {
  if (equal(action, type.clearAll)) {
    state = undefined;
  }
  return Redux.combineReducers(reducers)(state, action);
};
