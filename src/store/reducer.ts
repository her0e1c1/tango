import { uniq } from 'lodash';
import * as type from 'src/action/type';

export const equal = <T>(
  action: Action<any>,
  typ: (...args: any[]) => Action<T>
): action is Action<T> => {
  return action.type === typ().type;
};

export const deckInitialState = {
  byId: {},
  edit: {} as Deck,
  categories: [],
} as DeckState;

export const deck = (state = deckInitialState, action: Action) => {
  if (equal(action, type.deckBulkInsert)) {
    // TODO: cardOrderIds also fixed when a card is deleted
    const decks = action.payload.decks;
    decks.forEach(d => {
      const deck = state.byId[d.id] || {};
      state.byId[d.id] = {
        cardIds: [],
        cardOrderIds: [],
        selectedTags: [],
        currentIndex: 0,
        category: '',
        convertToBr: false,
        onlyBodyinWebview: true,
        scoreMax: null,
        ...deck,
        ...d,
      };
    });
    return {
      ...state,
      categories: uniq(decks.map(c => c.category)).filter(c => !!c),
    };
  } else if (equal(action, type.deckBulkUpdate)) {
    const decks = action.payload.decks;
    decks.forEach(d => (state.byId[d.id] = { ...state.byId[d.id], ...d }));
    return { ...state };
  } else if (equal(action, type.deckBulkDelete)) {
    action.payload.ids.forEach(id => delete state.byId[id]);
    return { ...state };
  } else if (equal(action, type.deckEdit)) {
    const edit = { ...state.edit, ...action.payload.deck };
    return { ...state, edit: { ...edit } };
  } else {
    return state;
  }
};

export const cardInitialState = {
  byId: {},
  tags: [],
  edit: {} as Card,
} as CardState;
export const card = (state = cardInitialState, action: Action) => {
  if (equal(action, type.cardBulkInsert)) {
    const cards = action.payload.cards;
    cards.forEach(c => {
      const current = state.byId[c.id] || {};
      state.byId[c.id] = {
        score: 0,
        numberOfSeen: 0,
        nextSeeingAt: new Date(0),
        ...current,
        ...c,
      };
    });
    cards.forEach(c => (c.tags || []).forEach(t => state.tags.push(t)));
    state.tags = uniq(state.tags);
    return { ...state };
  } else if (equal(action, type.cardBulkUpdate)) {
    const cards = action.payload.cards;
    cards.forEach(d => (state.byId[d.id] = { ...state.byId[d.id], ...d }));
    return { ...state };
  } else if (equal(action, type.cardBulkDelete)) {
    action.payload.ids.forEach(id => delete state.byId[id]);
    return { ...state };
  } else if (equal(action, type.deckBulkDelete)) {
    const ids = action.payload.ids;
    Object.values(state.byId).forEach(
      c => ids.includes(c.deckId) && delete state.byId[c.id]
    );
    return { ...state };
  } else if (equal(action, type.cardEdit)) {
    const edit = { ...state.edit, ...action.payload.card };
    return { ...state, edit };
  } else {
    return state;
  }
};

export const download = (
  state: DownloadState = {
    publicDecks: [],
    sheetById: {},
  },
  action: Action
) => {
  if (equal(action, type.sheetBulkInsert)) {
    action.payload.sheets.forEach(s => (state.sheetById[s.id] = s));
    return { ...state };
  } else if (equal(action, type.deckPublicBulkInsert)) {
    return { ...state, publicDecks: action.payload.decks };
  } else {
    return state;
  }
};

export const config = (
  state: ConfigState = {
    showSwipeButtonList: true,
    showMastered: true,
    showHeader: true,
    showBackText: false,
    maxNumberOfCardsToLearn: 0,
    hideBodyWhenCardChanged: true,
    shuffled: false,
    autoPlay: false,
    defaultAutoPlay: false,
    cardInterval: 0,
    keepBackTextViewed: false,
    isLoading: false, // maybe not here
    isLoadingNoAction: false,
    cardSwipeUp: 'DoNothing',
    cardSwipeDown: 'DoNothing',
    cardSwipeLeft: 'GoToPrevCard',
    cardSwipeRight: 'GoToNextCard',
    uid: '',
    displayName: '',
    selectedTags: [],
    lastUpdatedAt: 0,
    loadingCount: 0,
    googleAccessToken: '',
    googleRefreshToken: '',
  },
  action: Action
): ConfigState => {
  if (equal(action, type.configUpdate)) {
    const { loadingCount } = action.payload.config;
    if (loadingCount !== undefined && loadingCount < 0) {
      return state; // DO NOTHING
    }
    return { ...state, ...action.payload.config };
  } else {
    return state;
  }
};
