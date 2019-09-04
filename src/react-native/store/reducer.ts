import * as Redux from 'redux';
import * as type from 'src/action/type';
import { deck, card, config, sheet, equal } from 'src/store/reducer';

const reducers = {
  deck,
  card,
  sheet,
  config,
};

export const root = (state, action) => {
  if (equal(action, type.clearAll)) {
    state = undefined;
  }
  return Redux.combineReducers(reducers)(state, action);
};
