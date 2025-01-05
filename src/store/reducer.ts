import { uniq } from "lodash";
import * as util from "src/util";
import * as type from "src/action/type";

export const equal = <T>(action: Action<any>, typ: (...args: any[]) => Action<T>): action is Action<T> => {
  return action.type === typ().type;
};

export const deckInitialState = {
  byId: {},
  categories: [],
} as DeckState;

export const deck = (state = deckInitialState, action: Action) => {
  if (equal(action, type.deckBulkInsert)) {
    // TODO: cardOrderIds needs to be updated when a card is deleted
    const decks = action.payload.decks;
    decks.forEach((d) => {
      const deck = state.byId[d.id] != null || {};
      state.byId[d.id] = {
        ...deck,
        ...d,
        cardOrderIds: d.cardOrderIds ?? [],
        selectedTags: d.selectedTags ?? [],
        currentIndex: d.currentIndex ?? null,
        category: d.category ?? "",
        convertToBr: d.convertToBr ?? false,
        onlyBodyinWebview: d.onlyBodyinWebview ?? true,
        scoreMax: d.scoreMax ?? null,
        scoreMin: d.scoreMin ?? null,
        tagAndFilter: d.tagAndFilter ?? true,
      };
    });
    return {
      ...state,
      categories: uniq(decks.map((c) => c.category)).filter((c) => !!c),
    };
  } else if (equal(action, type.deckBulkUpdate)) {
    const decks = action.payload.decks;
    decks.forEach((d) => (state.byId[d.id] = { ...(state.byId[d.id] as Deck), ...d }));
    return { ...state };
  } else if (equal(action, type.deckBulkDelete)) {
    action.payload.ids.forEach((id) => delete state.byId[id]);
    return { ...state };
  } else {
    return state;
  }
};

export const cardInitialState = {
  byId: {},
  tags: [],
} as CardState;
export const card = (state = cardInitialState, action: Action) => {
  if (equal(action, type.cardBulkInsert)) {
    const cards = action.payload.cards;
    cards.forEach((c) => {
      const current = state.byId[c.id] != null || {};
      state.byId[c.id] = {
        ...current,
        ...c,
        score: c.score ?? 0,
        numberOfSeen: c.numberOfSeen ?? 0,
        nextSeeingAt: c.nextSeeingAt ?? new Date(0),
        interval: c.interval ?? 0,
      };
    });
    cards.forEach((c) => {
      (c.tags ?? []).forEach((t) => state.tags.push(t));
    });
    state.tags = uniq(state.tags);
    return { ...state };
  } else if (equal(action, type.cardBulkUpdate)) {
    const cards = action.payload.cards;
    cards.forEach((c) => (state.byId[c.id] = { ...(state.byId[c.id] as Card), ...c }));
    return { ...state };
  } else if (equal(action, type.cardBulkDelete)) {
    action.payload.ids.forEach((id) => delete state.byId[id]);
    return { ...state };
  } else if (equal(action, type.deckBulkDelete)) {
    const ids = action.payload.ids;
    Object.values(state.byId)
      .filter(util.isDefined)
      .forEach((c) => ids.includes(c.deckId) && delete state.byId[c.id]);
    return { ...state };
  } else {
    return state;
  }
};

export const config = (
  state: ConfigState = {
    useCardInterval: false,
    showSwipeButtonList: true,
    showScoreSlider: false,
    showHeader: true,
    showBackText: false,
    fullscreen: false,
    maxNumberOfCardsToLearn: 10,
    hideBodyWhenCardChanged: true,
    sizeBackText: 0,
    shuffled: false,
    autoPlay: false,
    defaultAutoPlay: false,
    cardInterval: 60,
    keepBackTextViewed: false,
    showSwipeFeedback: false,
    cardSwipeUp: "GoToNextCardMastered",
    cardSwipeDown: "GoToNextCardNotMastered",
    cardSwipeLeft: "GoToPrevCard",
    cardSwipeRight: "GoToNextCard",
    darkMode: false,
    uid: "",
    isAnonymous: true,
    displayName: "",
    selectedTags: [],
    lastUpdatedAt: 0,
    githubAccessToken: "",
  },
  action: Action
): ConfigState => {
  if (equal(action, type.configUpdate)) {
    return { ...state, ...action.payload.config };
  } else {
    return state;
  }
};
