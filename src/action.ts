import * as _ from 'lodash';
import * as Expo from 'expo';
import * as Redux from 'redux';
const Papa = require('papaparse');

const db = Expo.SQLite.openDatabase('db3.db');

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
        name text,
        body text
    );`
  );
});

// declare const createAction(type: string): void;
const createAction = (type: string, payloadCreator?: any) => {
  const _payloadCreator = payloadCreator || (() => {});
  const actionCreator = (...args: any[]) => {
    const payload = _payloadCreator(...args);
    return { type, payload };
  };
  actionCreator.type = type;
  return actionCreator;
};

export const deleteCard = (card: Card) => async (dispatch, getState) => {
  db.transaction(tx =>
    tx.executeSql(`delete from card where id = ?;`, [card.id], (_, result) => {
      dispatch({ type: 'DELETE', payload: { card } });
    })
  );
};

export const insertByURL = (url: string) => async (dispatch, getState) => {
  console.log('hoge');
  dispatch(insertDeck({ url: 'hoge', name: 'name' }));
  return true;
  const res = await fetch(url);
  const text = await res.text();
  const data = Papa.parse(text).data.filter(row => row.length >= 2);
  await Promise.all(
    data.map(async d => {
      const card: Card = { name: d[0], body: d[1] };
      await dispatch(insert(card));
    })
  );
};

// can config limit
export const select = (limit: 50) => async (dispatch, getState) => {
  db.transaction(tx =>
    tx.executeSql(`select * from card limit  ?;`, [limit], (_, result) => {
      const cards = result.rows._array;
      dispatch({ type: 'BULK_INSERT', payload: { cards } });
    })
  );
};

export const selectDeck = (limit?: 50) => async (dispatch, getState) => {
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

export const insert = (card: Pick<Card, 'name' | 'body'>) => async (
  dispatch,
  getState
) => {
  db.transaction(tx =>
    tx.executeSql(
      `insert into card (name, body) values (?, ?);`,
      [card.name, card.body],
      (_, result) => {}
    )
  );
};

export const insertDeck = (deck: Deck) => async (dispatch, getState) => {
  db.transaction(tx =>
    tx.executeSql(
      `insert into deck (name, url) values (?, ?) ;`,
      [deck.name, deck.url],
      (info, result) => {
        dispatch({ type: 'DECK_INSERT', payload: { deck } });
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

export const getAll = state =>
  Object.keys(state.card.byId).map(id => state.card.byId[id]);

export const getAllDeck = state =>
  Object.keys(state.card.byId).map(id => state.card.byId[id]);

export const card = (state = { byId: {} }, action: Redux.Action) => {
  if (action.type == 'INSERT') {
    const ns = _.clone(state);
    const c = action.payload.card;
    ns.byId[c.id] = c;
    return ns;
  } else if (action.type == 'BULK_INSERT') {
    const ns = _.clone(state);
    action.payload.cards.forEach(c => (ns.byId[c.id] = c));
    return ns;
  } else if (action.type == 'DELETE') {
    const ns = _.clone(state);
    const c = action.payload.card;
    delete ns.byId[c.id];
    return ns;
  } else {
    return state;
  }
};

export const deck = (
  state: { [key: string]: Deck } = {},
  action: Redux.Action
) => {
  console.log(action);
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
