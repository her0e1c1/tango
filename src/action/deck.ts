import moment from "moment";
import { shuffle } from "lodash";
import { saveAs } from "file-saver";
import * as Papa from "papaparse";

import * as type from "./type";
import * as C from "../constant";
import { type ThunkResult } from "./index";
import * as action from ".";
import * as selector from "../selector";
import * as firestore from "./firestore";
import sampleCards from "../../sample/build/output.json";

export const prepare = (deck: Partial<Deck>, uid: string): DeckDB => {
  return {
    ...deck,
    uid,
    currentIndex: null,
    scoreMax: null,
    scoreMin: null,
    sheetId: null,
    url: null,
    isPublic: false,
    deletedAt: null,
  } as any;
};

export const generateName = (deckName: string, state: DeckState): string => {
  const names = new Set(Object.values(state.byId).map((d) => d?.name));
  if (!names.has(deckName)) return deckName;
  let i = 1;
  for (;;) {
    const name = `${deckName}_${i}`;
    if (!names.has(name)) return name;
    i++;
  }
};

export const create =
  (deckName: string, cards: CardNew[]): ThunkResult =>
  async (_dispatch, getState) => {
    const uid = getState().config.uid;
    const name = generateName(deckName, getState().deck);
    const deck = prepare({ name } as DeckDB, uid);
    void firestore.deck.create(deck, cards);
  };

export const upsert =
  (deck: Deck, cards: Array<Omit<Card, "id">>): ThunkResult =>
  async () => {
    void firestore.card.bulkCreate(cards, deck);
  };

export const update =
  (deck: Partial<Deck> & { id: string }, opt?: { noDelay: boolean }): ThunkResult =>
  async (dispatch) => {
    const { noDelay } = { ...opt };
    void firestore.deck.update(deck); // fire&forget
    if (noDelay) {
      await dispatch(type.deckUpdate(deck));
    }
  };

export const remove =
  (deckId: string): ThunkResult =>
  async (_dispatch, getState) => {
    const uid = getState().config.uid;
    void firestore.deck.remove(deckId, uid); // fire&forget
  };

export const start =
  (deckId: DeckId): ThunkResult =>
  async (dispatch, getState) => {
    const cards = selector.card.getFilteredByDeckId(deckId)(getState());
    const config = getState().config;
    cards.sort((c1, c2) => c1.numberOfSeen - c2.numberOfSeen);
    let cardOrderIds = cards.map((c) => c.id);
    if (config.shuffled) {
      cardOrderIds = shuffle(cardOrderIds);
    }
    if (config.maxNumberOfCardsToLearn > 0) {
      cardOrderIds = cardOrderIds.slice(0, config.maxNumberOfCardsToLearn);
    }
    // before going to DeckSwiperPage, need to set cardOrderIds without delay (otherwise, it would go back to the previous page)
    await dispatch(action.deck.update({ id: deckId, currentIndex: 0, cardOrderIds }, { noDelay: true }));
    await dispatch(
      type.configUpdate({
        showBackText: false,
        autoPlay: config.defaultAutoPlay,
      })
    );
  };

const getCardScore = (card: Card, mastered?: boolean) => {
  let score;
  if (mastered) {
    score = card.score >= 0 ? card.score + 1 : 0;
  } else if (!mastered) {
    score = card.score <= 0 ? card.score - 1 : 0;
  } else {
    score = 0;
  }
  return score;
};

export const swipe =
  (direction: SwipeDirection, deckId: string): ThunkResult =>
  async (dispatch, getState) => {
    const deck = getState().deck.byId[deckId];
    if (deck == null) throw Error("invalid deck id");
    const cardId = deck.cardOrderIds[deck.currentIndex ?? 0];
    const card = getState().card.byId[cardId];
    if (card == null) throw Error("invalid card id");
    const config = getState().config;
    const value = config[direction];

    if (value === "DoNothing") {
      return;
    }

    dispatch(type.configUpdate({ lastSwipe: direction }));

    if (value === "GoBack") {
      await dispatch(update({ id: deck.id, currentIndex: -1 }));
      return;
    }
    if (config.hideBodyWhenCardChanged) {
      dispatch(type.configUpdate({ showBackText: false }));
    }

    const numberOfSeen = card.numberOfSeen + 1;
    const lastSeenAt = new Date().getTime();

    let score = card.score;
    if (value === "GoToNextCardMastered") {
      score = getCardScore(card, true);
    } else if (value === "GoToNextCardNotMastered") {
      score = getCardScore(card, false);
    } else if (value === "GoToNextCardToggleMastered") {
      score = getCardScore(card);
    }

    let interval = card.interval;
    const index = C.NEXT_SEEING_MINUTES_KEYS.findIndex((i) => i >= interval);
    if (card.score < score && index < C.NEXT_SEEING_MINUTES_KEYS.length - 1) {
      interval = C.NEXT_SEEING_MINUTES_KEYS[index + 1];
    } else if (card.score > score && index > 0) {
      interval = C.NEXT_SEEING_MINUTES_KEYS[index - 1];
    }

    const nextSeeingAt = moment(lastSeenAt).add(interval, "minute").toDate();

    await dispatch(
      action.card.update({
        id: card.id,
        score,
        numberOfSeen,
        interval,
        lastSeenAt,
        nextSeeingAt,
      })
    );

    let currentIndex: number = deck.currentIndex ?? 0;
    if (value === "GoToPrevCard") {
      currentIndex -= 1;
    } else {
      currentIndex += 1;
    }
    if (currentIndex >= 0 && currentIndex < deck.cardOrderIds.length) {
      await dispatch(action.deck.update({ id: deck.id, currentIndex }));
    } else {
      await dispatch(action.deck.update({ id: deck.id, currentIndex: -1 }));
    }
  };

export const download =
  (id: string): ThunkResult =>
  async (dispatch, getState) => {
    const deck = getState().deck.byId[id];
    const card = getState().card;
    if (deck == null) {
      return;
    }
    const cards = Object.values(card.byId).filter((c) => c?.deckId === id) as Card[];
    const data = cards.map(action.card.toRow);
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/plain;charset=utf-8" });
    let name = deck.name;
    if (!name.endsWith(".csv")) {
      name += ".csv";
    }
    saveAs(blob, name);
  };

export const downloadCsvSampleText = (): ThunkResult => async () => {
  const blob = new Blob([C.CSV_SAMPLE_TEXT], { type: "text/plain;charset=utf-8" });
  saveAs(blob, "sample.csv");
};

export const findIdByName = (deckName: string, state: DeckState): Deck | null => {
  const ids = Object.keys(state.byId);
  for (let i = 0; i < ids.length; i++) {
    const d = state.byId[ids[i]];
    if (d?.name === deckName) {
      return d;
    }
  }
  return null;
};

export const spliteCreate =
  (deckName: string, cards: Card[]): ThunkResult =>
  async (dispatch, getState) => {
    const [newCards, oldCards] = splitByUniqueKey(cards, getState().card);
    await dispatch(action.card.bulkUpdate(oldCards));
    const deck = findIdByName(deckName, getState().deck);
    if (deck == null) {
      await dispatch(action.deck.create(deckName, newCards));
    } else {
      await dispatch(action.deck.upsert(deck, newCards));
    }
    process.env.NODE_ENV !== "production" &&
      console.log(
        (deck == null ? "CREATE" : "UPATE") +
          ` ${deckName} DECK WITH NEW ${newCards.length} AND OLD ${oldCards.length} CARDS`
      );
  };

export const reimport =
  (id: string): ThunkResult =>
  async (dispatch, getState) => {
    const deck = getState().deck.byId[id];
    if (deck == null) throw Error("invalid deck id");
    if (deck.url == null) throw Error("no deck url");
    await dispatch(parseUrl(deck.url, deck.name));
  };

export const parseUrl =
  (url: string, deckName?: string): ThunkResult =>
  async (dispatch, getState) => {
    if (deckName == null) deckName = url.split("/").pop() ?? "no name";
    const token = getState().config.githubAccessToken;
    let headers = {} as Record<string, string>;
    if (token !== "") {
      headers = {
        Accept: "application/vnd.github.raw",
        Authorization: `Bearer ${token}`,
      };
    }
    const res = await fetch(url, { headers });
    const text = await res.text();
    const cards = await parseCsv(text);
    await dispatch(action.deck.spliteCreate(deckName, cards));
  };

export const loadSample = (): ThunkResult => async (dispatch, getState) => {
  if (getState().config.loadSample) {
    const deckName = "Sample Deck";
    await dispatch(action.deck.spliteCreate(deckName, sampleCards as Card[]));
    await dispatch(type.configUpdate({ loadSample: false }));
  }
};

export const parseFile =
  (file: File): ThunkResult =>
  async (dispatch) => {
    const cards = await parseCsv(file);
    const deckName = file.name;
    await dispatch(action.deck.spliteCreate(deckName, cards));
  };

export const parseCsv = async (content: any): Promise<Card[]> => {
  return await new Promise((resolve) =>
    Papa.parse(content, {
      complete: async (results: { data: string[][] }) => {
        const cards = results.data.map(action.card.fromRow).filter((c) => !action.card.isEmpty(c)) as Card[];
        resolve(cards);
      },
    })
  );
};

export const splitByUniqueKey = (cards: Card[], state: CardState): [Card[], Card[]] => {
  const newCards = [] as Card[];
  const oldCards = [] as Card[];
  const byUniqueKey = {} as Record<string, string>;
  Object.keys(state.byId).forEach((id) => {
    const key = (state.byId[id] as Card).uniqueKey;
    if (key.length > 0) {
      byUniqueKey[key] = id;
    }
  });
  cards.forEach((c) => {
    const id = byUniqueKey[c.uniqueKey];
    if (id) {
      oldCards.push(c);
    } else {
      newCards.push(c);
    }
  });
  return [newCards, oldCards];
};
