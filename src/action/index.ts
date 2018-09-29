import * as card from './card';
import * as deck from './deck';
import * as nav from './nav';
import * as auth from './auth';
import * as config from './config';
import * as drive from './drive';

export * from 'src/react-native/action';
export * from 'src/web/action';
export { card, auth, deck, nav, config, drive };

import * as Papa from 'papaparse';
import * as WebAction from 'src/web/action';
import * as type from 'src/action/type';

export const insertByURL = (url: string): ThunkAction => async (
  dispatch,
  getState
) => {
  __DEV__ && console.log(`FETCH START: ${url}`);
  const res = await fetch(url);
  const text = await res.text();
  const name = url.split('/').pop() || 'sample';
  await dispatch(
    insertByText(text, {
      name,
      url,
    })
  );
};

export const insertByText = (text, deck): ThunkAction => (
  dispatch,
  _getState
) => {
  // info.file.originFileObj
  const results = Papa.parse(text);
  __DEV__ && console.log('DEBUG: CSV COMPLETE', results);
  const cards: Card[] = results.data
    .map(d => ({
      frontText: d[0] || '',
      backText: d[1] || '',
      hint: d[2] || '',
      tags: [],
    }))
    .filter(c => !!c.frontText);
  const d = { name: deck.name, isPublic: false };
  dispatch(WebAction.deckCreate(d, cards));
  /*
  Papa.parse(text, {
    complete: async results => {
      __DEV__ && console.log('DEBUG: CSV COMPLETE', results);
      const cards: Card[] = results.data
        .map(d => ({
          frontText: d[0] || '',
          backText: d[1] || '',
          hint: d[2] || '',
          tags: [],
        }))
        .filter(c => !!c.frontText);
      const d = { name: deck.name, isPublic: false };
      dispatch(WebAction.deckCreate(d, cards));
    },
  });
  */
};
