import * as _ from 'lodash';
import * as Expo from 'expo';
import * as Redux from 'redux';
const Papa = require('papaparse');

const db = Expo.SQLite.openDatabase('db4.db');

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
        deck_id integer,
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
    tx.executeSql(
      `delete from card where id = ?;`,
      [card.id],
      (_, result) => {
        dispatch({ type: 'DELETE', payload: { card } });
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

export const deleteDeck = (deck: Deck) => async (dispatch, getState) => {
  db.transaction(tx =>
    tx.executeSql(
      `delete from deck where id = ?; commit`,
      [deck.id],
      (_, result) => {
        console.log(result, deck);
        if (result.rowsAffected === 1)
          dispatch({ type: 'DECK_DELETE', payload: { deck } });
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

// should use select last_insert_rowid()
// but for now, use timestamp as id
export const insertByURL = (url: string) => async (dispatch, getState) => {
  const deck_id = new Date().getTime();
  const res = await fetch(url);
  const text = await res.text();
  const data = Papa.parse(text).data.filter(row => row.length >= 2);
  await dispatch(insertDeck({ url: url, name: 'sample', id: deck_id }));
  await Promise.all(
    data.map(async d => {
      const card: Card = { name: d[0], body: d[1], deck_id };
      await dispatch(insertCard(card));
    })
  );
};

// can config limit
export const selectCard = (deck_id?: number) => async (dispatch, getState) => {
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

export const selectDeck = (limit: number = 50) => async (
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

export const insertCard = (
  card: Pick<Card, 'name' | 'body' | 'deck_id'>
) => async (dispatch, getState) => {
  db.transaction(tx =>
    tx.executeSql(
      `insert into card (name, body, deck_id) values (?, ?, ?);`,
      [card.name, card.body, card.deck_id],
      (_, result) => {},
      (...args) => alert(JSON.stringify(args))
    )
  );
};

export const insertDeck = (deck: Pick<Deck, 'id' | 'name' | 'url'>) => async (
  dispatch,
  getState
) => {
  db.transaction(tx =>
    tx.executeSql(
      `insert into deck (id, name, url) values (?, ?, ?)`,
      [deck.id, deck.name, deck.url],
      (_, result) => {
        dispatch({ type: 'DECK_INSERT', payload: { deck } });
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

export const card = (
  state = { byId: {}, byDeckId: {} },
  action: Redux.Action
) => {
  console.log(action.type);
  if (action.type == 'INSERT') {
    const ns = _.clone(state);
    const c = action.payload.card;
    ns.byId[c.id] = c;
    ns.byDeckId[c.deck_id]
      ? ns.byDeckId[c.deck_id].push(c.id)
      : (ns.byDeckId[c.deck_id] = [c.id]);
    return ns;
  } else if (action.type == 'BULK_INSERT') {
    const ns = _.clone(state);
    action.payload.cards.forEach(c => {
      ns.byId[c.id] = c;
      ns.byDeckId[c.deck_id]
        ? ns.byDeckId[c.deck_id].push(c.id)
        : (ns.byDeckId[c.deck_id] = [c.id]);
    });
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
  // console.log(action);
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
