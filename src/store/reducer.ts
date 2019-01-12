import * as _ from 'lodash';
import { uniq } from 'lodash';
import * as type from 'src/action/type';

export const equal = <T>(
  action: Action<any>,
  type: (...args: any[]) => Action<T>
): action is Action<T> => {
  return action.type === type().type;
};

// NOTE: should handle both Deck and DeckModel
export const deck = (
  state: DeckState = { byId: {}, edit: {} as Deck, categories: ['math'] },
  action: Action
) => {
  if (equal(action, type.deckBulkInsert)) {
    const decks = action.payload.decks;
    decks.forEach(d => {
      let currentIndex = d.currentIndex;
      if (currentIndex === undefined) {
        const deck = state.byId[d.id];
        if (deck) {
          if (deck.currentIndex === undefined) {
            currentIndex = 0;
          } else {
            currentIndex = deck.currentIndex;
          }
        } else {
          currentIndex = 0;
        }
      }
      state.byId[d.id] = { ...d, currentIndex };
    });
    return {
      ...state,
      categories: uniq(decks.map(c => c.category)).filter(c => !!c),
    };
  } else if (equal(action, type.deckBulkUpdate)) {
    const decks = action.payload.decks;
    decks.forEach(d => (state.byId[d.id] = { ...state.byId[d.id], ...d }));
    return { ...state };
  } else if (equal(action, type.deckDelete)) {
    const id = action.payload.deckId;
    delete state.byId[id];
    return { ...state };
  } else if (equal(action, type.deckBulkDelete)) {
    action.payload.deckIds.forEach(id => delete state.byId[id]);
    return { ...state };
  } else if (equal(action, type.deckEdit)) {
    const edit = Object.assign(state.edit || {}, action.payload.deck);
    return { ...state, edit };
  } else {
    return state;
  }
};

export const card = (
  state: CardState = {
    byId: {},
    tags: [],
    edit: {} as Card,
  },
  action: Action
) => {
  if (equal(action, type.cardBulkInsert)) {
    const cs = action.payload.cards;
    cs.forEach(c => (state.byId[c.id] = c));
    cs.forEach(c => (c.tags || []).forEach(t => state.tags.push(t)));
    state.tags = uniq(state.tags);
    return { ...state };
  } else if (equal(action, type.cardDelete)) {
    const id = action.payload.id;
    delete state.byId[id];
    return { ...state };
  } else if (equal(action, type.deckDelete)) {
    const id = action.payload.deckId;
    Object.values(state.byId).forEach(
      c => c.deckId === id && delete state.byId[c.id]
    );
    return state;
    // } else if (equal(action, type.card_shuffle)) {
    //   const config: ConfigState = action.payload.config;
    //   const byDeckId = Object.entries(state.byDeckId)
    //     .map(e => ({ [e[0]]: config.shuffled ? _.shuffle(e[1]) : e[1].sort() }))
    //     .reduce((obj, e) => ({ ...obj, ...e }));
    //   return { ...state, byDeckId };
  } else if (equal(action, type.cardEditInit)) {
    return { ...state, edit: { tags: [] } };
  } else if (equal(action, type.cardEdit)) {
    const edit = { ...state.edit, ...action.payload.card };
    return { ...state, edit };
  } else {
    return state;
  }
};

export const sheet = (
  state: SheetState = {
    byId: {},
  },
  action: Action
) => {
  if (equal(action, type.sheetBulkInsert)) {
    const ss = action.payload.sheets;
    ss.forEach(s => (state.byId[s.id] = s));
    return { ...state };
  } else {
    return state;
  }
};

export const config = (
  state: ConfigState = {
    showMastered: true,
    showHeader: true,
    showBody: false,
    showHint: false,
    hideBodyWhenCardChanged: true,
    shuffled: false,
    cardInterval: 5,
    theme: 'default',
    isLoading: false, // maybe not here
    cardSwipeUp: 'goToNextCardToggleMastered',
    cardSwipeDown: 'goBack',
    cardSwipeLeft: 'goToPrevCard',
    cardSwipeRight: 'goToNextCard',
    uid: '',
    displayName: '',
    selectedTags: [],
    lastUpdatedAt: 0,
    loadingCount: 0,
  },
  action: Action
): ConfigState => {
  if (equal(action, type.configUpdate)) {
    return { ...state, ...action.payload.config };
  } else {
    return state;
  }
};
