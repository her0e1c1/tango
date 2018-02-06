import * as RN from 'react-native';
import * as _ from 'lodash';
import * as Expo from 'expo';
import * as Redux from 'redux';
import * as I from 'src/interface';
const Papa = require('papaparse');

const db = Expo.SQLite.openDatabase('db5.db');

db.transaction((tx: any) => {
  // PRAGMA foreign_keys = ON;
  tx.executeSql(
    `create table if not exists deck (
        id integer primary key not null,
        name text,
        url text
    );`
  );
  tx.executeSql(
    `create table if not exists card (
        id integer primary key not null,
        mastered boolean default 0 not null,
        deck_id integer,
        name text,
        body text,
        category text,
        hint text
    );`
  );
});

export const deleteCard = (card: Card): I.ThunkAction => async (
  dispatch,
  getState
) => {
  db.transaction(tx =>
    tx.executeSql(
      `delete from card where id = ?;`,
      [card.id],
      (_, result) => {
        if (result.rowsAffected === 1) {
          dispatch({ type: 'DELETE', payload: { card } });
        } else {
          alert('You can not delete');
        }
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

export const deleteDeck = (deck: Deck): I.ThunkAction => async (
  dispatch,
  getState
) => {
  db.transaction(tx =>
    tx.executeSql(
      `delete from deck where id = ?; commit`,
      [deck.id],
      (_, result) => {
        if (result.rowsAffected === 1) {
          dispatch({ type: 'DECK_DELETE', payload: { deck } });
          tx.executeSql(
            'delete from card where deck_id = ?',
            [deck.id],
            (_, result) => {
              dispatch({ type: 'CARD_BULK_DELETE', payload: { deck } });
            }
          );
        } else {
          alert('You can not delete');
        }
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

export const insertByURL = (url: string): I.ThunkAction => async (
  dispatch,
  getState
) => {
  console.log(`FETCH START: ${url}`);
  const res = await fetch(url);
  const text = await res.text();
  const data = Papa.parse(text).data.filter(row => row.length >= 2);
  if (data.length === 0) {
    const errorCode: errorCode = 'NO_CARDS';
    await dispatch({ type: 'CONFIG', payload: { config: { errorCode } } });
    return;
  }
  const name = url.split('/').pop() || 'sample';
  const cards: Card[] = data.map(d => ({ name: d[0], body: d[1] }));
  const deck_id = await dispatch(insertDeck({ url, name }));
  await dispatch(bulkInsertCards(deck_id, cards));
  console.log(`FETCH DONE ${deck_id}`);
};

// can config limit
export const selectCard = (deck_id?: number): I.ThunkAction => async (
  dispatch,
  getState
) => {
  db.transaction(tx =>
    tx.executeSql(
      `select * from card`,
      [],
      (_, result) => {
        const cards = result.rows._array;
        dispatch({ type: 'BULK_INSERT', payload: { cards } });
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

export const selectDeck = (limit: number = 50): I.ThunkAction => async (
  dispatch,
  getState
) => {
  db.transaction(tx =>
    tx.executeSql(
      `select * from deck;`,
      [],
      (_, result) => {
        const decks = result.rows._array;
        dispatch({ type: 'DECK_BULK_INSERT', payload: { decks } });
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

// FIXME: how can I bulk insert?
export const bulkInsertCards = (
  deck_id: number,
  cards: Pick<Card, 'name' | 'body'>[]
): I.ThunkAction => (dispatch, getState) =>
  new Promise((resolve, reject) =>
    db.transaction(async tx => {
      await Promise.all(
        cards.map(
          card =>
            new Promise(resolve =>
              tx.executeSql(
                `insert into card (name, body, deck_id) values (?, ?, ?);`,
                [card.name, card.body, deck_id],
                async (_, result) => {
                  const id = result.insertId;
                  id &&
                    (await dispatch({
                      type: 'INSERT',
                      payload: { card: { ...card, deck_id, id } as Card },
                    }));
                  resolve();
                },
                (...args) => reject(alert(JSON.stringify(args)))
              )
            )
        )
      );
      resolve();
    })
  );

export const insertDeck = (deck: Pick<Deck, 'name' | 'url'>): I.ThunkAction => (
  dispatch,
  getState
) =>
  new Promise((resolve, reject) =>
    db.transaction(tx =>
      tx.executeSql(
        `insert into deck (name, url) values (?, ?)`,
        [deck.name, deck.url],
        async (_, result) => {
          const id = result.insertId;
          await dispatch({
            type: 'DECK_INSERT',
            payload: { deck: { ...deck, id } },
          });
          resolve(id);
        },
        (...args) => reject(alert(JSON.stringify(args)))
      )
    )
  );

export const toggleMastered = (
  card: Card,
  mastered?: boolean
): I.ThunkAction => async (dispatch, getState) => {
  const m = mastered === undefined ? !card.mastered : mastered;
  return new Promise((resolve, reject) =>
    db.transaction(tx =>
      tx.executeSql(
        `update card set mastered = ? where id = ?`,
        [m, card.id],
        (_, result) => {
          dispatch({
            type: 'INSERT',
            payload: { card: { ...card, mastered: m } },
          });
          resolve();
        },
        (...args) => reject(alert(JSON.stringify(args)))
      )
    )
  );
};

export const shuffleCardsOrSort = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const config = getState().config;
  dispatch({ type: 'CARD_SHUFFLE', payload: { config } });
};

// selector
export const getCurrentCard = (state: RootState) => {
  const cards = getCurrentCardList(state);
  if (state.nav.index) {
    return cards[state.nav.index];
  }
  return state.nav.card;
};
export const getCurrentCardList = (state: RootState): Card[] => {
  const deck = state.nav.deck;
  const config = state.config;
  if (deck) {
    const ids = state.card.byDeckId[deck.id] || [];
    const cards = ids
      .map(id => state.card.byId[id])
      .filter(c => !!c) // defensive
      .filter(c => {
        if (config.showMastered) {
          return true;
        } else {
          return !c.mastered;
        }
      });
    return cards.slice(config.start);
  } else {
    return [];
  }
};

export const getTheme = (state: RootState): Theme => {
  const theme = state.config.theme;
  if (theme === 'dark') {
    return {
      mainBackgroundColor: 'black',
      mainColor: 'silver',
      titleColor: 'silver',
      cardBackgroundColor: '#111',
      cardBorderColor: 'gray',
      circleBackgroundColor: '#222',
    };
  } else {
    // default
    return {
      mainBackgroundColor: 'skyblue',
      mainColor: 'black',
      titleColor: 'white',
      cardBorderColor: 'white',
      cardBackgroundColor: 'white',
      circleBackgroundColor: 'white',
    };
  }
};

const updateCard = (state: CardState, cards: Card[]) => {
  const ns = _.clone(state);
  cards.forEach(c => {
    ns.byId[c.id] = c;
    const ids = ns.byDeckId[c.deck_id];
    if (!ids) {
      ns.byDeckId[c.deck_id] = [c.id];
    } else if (!ids.includes(c.id)) {
      ns.byDeckId[c.deck_id].push(c.id);
    }
  });
  return ns;
};
// reducer
export const card = (
  state: CardState = { byId: {}, byDeckId: {} },
  action: Redux.Action
) => {
  if (action.type == 'INSERT') {
    const c = action.payload.card;
    return updateCard(state, [c]);
  } else if (action.type == 'BULK_INSERT') {
    const cs = action.payload.cards;
    return updateCard(state, cs);
  } else if (action.type == 'CARD_BULK_DELETE') {
    const deck_id = action.payload.deck.id;
    const ids = state.byDeckId[deck_id];
    ids.forEach(id => delete state.byId[id]);
    delete state.byDeckId[deck_id];
    return { ...state };
  } else if (action.type == 'DELETE') {
    const ns = _.clone(state);
    const c = action.payload.card;
    delete ns.byId[c.id];
    ns.byDeckId = _.pull(ns.byDeckId, c.id);
    return ns;
  } else if (action.type == 'CARD_SHUFFLE') {
    const config: ConfigState = action.payload.config;
    const byDeckId = Object.entries(state.byDeckId)
      .map(e => ({ [e[0]]: config.shuffled ? _.shuffle(e[1]) : e[1].sort() }))
      .reduce((obj, e) => ({ ...obj, ...e }));
    return { ...state, byDeckId };
  } else {
    return state;
  }
};

export const deck = (
  state: { [key: string]: Deck } = {},
  action: Redux.Action
) => {
  if (action.type == 'DECK_INSERT') {
    const d: Deck = action.payload.deck;
    return { ...state, [d.id]: d };
  } else if (action.type == 'DECK_BULK_INSERT') {
    action.payload.decks.forEach(d => {
      state[d.id] = d;
    });
    return { ...state };
  } else if (action.type == 'DECK_DELETE') {
    const d: Deck = action.payload.deck;
    delete state[d.id];
    return { ...state };
  } else {
    return state;
  }
};

export const goTo = (nav: NavState): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const { index } = nav;
  if (index === undefined || 0 <= index) {
    dispatch({ type: 'NAV_GO_TO', payload: { nav } });
  } else if (index < 0) {
    dispatch(goBack());
  }
};

export const goToNextCardSetMastered = (
  mastered?: boolean
): I.ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const card = getCurrentCard(state);
  if (card) {
    await dispatch(toggleMastered(card, mastered));
    await dispatch(goToNextCard());
  }
};

export const goToNextCardToggleMastered = () => goToNextCardSetMastered();
export const goToNextCardNotMastered = () => goToNextCardSetMastered(false);
export const goToNextCardMastered = () => goToNextCardSetMastered(true);

export const goToNextCard = (): I.ThunkAction => async (dispatch, getState) => {
  const state = getState();
  if (state.config.showMastered) {
    const nav = { index: state.nav.index + 1 };
    dispatch(goTo(nav));
  }
};

export const goToPrevCard = (): I.ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const nav = { index: state.nav.index - 1 };
  dispatch(goTo(nav));
};

export const goHome = (): I.ThunkAction => async (dispatch, getState) => {
  dispatch({ type: 'NAV_HOME' });
};

export const goBack = () => async (dispatch, getState) => {
  const { deck, card, index }: NavState = getState().nav;
  let nav = {};
  if (index) {
    nav = { deck };
  } else if (card) {
    nav = { deck };
  }
  dispatch({ type: 'NAV_GO_BACK', payload: { nav } });
};

export const nav = (state: NavState = {}, action: Redux.Action): NavState => {
  if (action.type == 'NAV_GO_TO') {
    return { ...state, ...action.payload.nav };
  } else if (action.type == 'NAV_GO_BACK') {
    return action.payload.nav;
  } else if (action.type == 'NAV_HOME') {
    return { deck: undefined, card: undefined, index: undefined };
  } else {
    return state;
  }
};

export const updateConfig = (config: Partial<ConfigState>) => async (
  dispatch,
  getState
) => {
  dispatch({ type: 'CONFIG', payload: { config } });
};

export const startLoading = () => async (dispatch, getState) => {
  dispatch({ type: 'CONFIG', payload: { config: { isLoading: true } } });
};

export const endLoading = () => async (dispatch, getState) => {
  dispatch({ type: 'CONFIG', payload: { config: { isLoading: false } } });
};

export const tryInsertByURL = (text: string) => async (dispatch, getState) => {
  if (text.match(/^https?:\/\//)) {
    await dispatch(startLoading());
    try {
      await dispatch(await insertByURL(text));
    } catch {
      const errorCode: errorCode = 'CAN_NOT_FETCH';
      await dispatch({ type: 'CONFIG', payload: { config: { errorCode } } });
    } finally {
      await dispatch(endLoading());
    }
  } else if (text !== '') {
    const errorCode: errorCode = 'INVALID_URL';
    await dispatch({ type: 'CONFIG', payload: { config: { errorCode } } });
  }
};

export const clearError = () => async (dispatch, getState) => {
  await dispatch({ type: 'CONFIG', payload: { config: { undefined } } });
};

const swipeMapping = {
  goBack,
  goToPrevCard,
  goToNextCard,
  goToNextCardMastered,
  goToNextCardNotMastered,
  goToNextCardToggleMastered,
};

const cardSwipe = (direction): I.ThunkAction => async (dispatch, getState) => {
  const config = getState().config;
  const f = swipeMapping[config[direction]];
  if (f) {
    dispatch(f());
  } else {
    console.log(`${direction} action is not found`);
  }
};
export const cardSwipeUp = () => cardSwipe('cardSwipeUp');
export const cardSwipeDown = () => cardSwipe('cardSwipeDown');
export const cardSwipeLeft = () => cardSwipe('cardSwipeLeft');
export const cardSwipeRight = () => cardSwipe('cardSwipeRight');

export const clearAll = () => async (dispatch, getState) => {
  dispatch({ type: 'CLEAR_ALL' });
  RN.AsyncStorage.clear();
};

export const config = (
  state: ConfigState = {
    showMastered: true,
    showHeader: true,
    shuffled: false,
    start: 0,
    theme: 'default',
    isLoading: false, // maybe not here
    errorCode: undefined,
    cardSwipeUp: 'goToNextCardToggleMastered',
    cardSwipeDown: 'goBack',
    cardSwipeLeft: 'goToPrevCard',
    cardSwipeRight: 'goToNextCardNotMastered',
  },
  action: Redux.Action
): ConfigState => {
  if (action.type == 'CONFIG') {
    return { ...state, ...action.payload.config };
  } else {
    return state;
  }
};

export const reducers = {
  deck,
  card,
  nav,
  config,
};
