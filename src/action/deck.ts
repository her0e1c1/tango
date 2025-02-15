// import moment from "moment";
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

export const prepare = (deck: DeckRaw, config: DeckConfig): Deck => {
  const { uid, localMode } = config;
  return {
    ...deck,
    uid,
    localMode,
    id: firestore.mocked.generateDeckId(),
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    currentIndex: null,
    scoreMax: null,
    scoreMin: null,
    isPublic: false,
    cardOrderIds: [],
    selectedTags: [],
    tagAndFilter: false,
    convertToBr: false,
    category: "",
  };
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
  (deckName: string): ThunkResult<Promise<string>> =>
  async (dispatch, getState) => {
    const config = getState().config;
    const name = generateName(deckName, getState().deck);
    const deck = prepare({ name } as Deck, config);
    if (!deck.localMode) {
      await firestore.deck.create(deck);
    }
    await dispatch(type.deckInsert(deck));
    return deck.id;
  };

export const update =
  (deck: DeckEdit): ThunkResult =>
  async (dispatch) => {
    // must be no deplay when going to deck swiper page
    if (!deck.localMode) {
      void firestore.deck.update(deck); // fire&forget
    }
    await dispatch(type.deckUpdate(deck));
  };

export const remove =
  (deckId: string): ThunkResult =>
  async (dispatch, getState) => {
    const deck = getState().deck.byId[deckId];
    if (deck == null) throw Error("invalid deck id");
    if (!deck.localMode) {
      void firestore.deck.remove(deckId, deck.uid); // fire&forget
    }
    await dispatch(type.deckDelete(deckId));
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
    await dispatch(action.deck.update({ id: deckId, currentIndex: 0, cardOrderIds }));
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

    // let interval = card.interval;
    // const index = C.NEXT_SEEING_MINUTES_KEYS.findIndex((i) => i >= interval);
    // if (card.score < score && index < C.NEXT_SEEING_MINUTES_KEYS.length - 1) {
    //   interval = C.NEXT_SEEING_MINUTES_KEYS[index + 1];
    // } else if (card.score > score && index > 0) {
    //   interval = C.NEXT_SEEING_MINUTES_KEYS[index - 1];
    // }
    // const nextSeeingAt = moment(lastSeenAt).add(interval, "minute").toDate();

    await dispatch(
      action.card.update({
        id: card.id,
        deckId: card.deckId,
        score,
        numberOfSeen,
        lastSeenAt,
        // interval,
        // nextSeeingAt,
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
    _saveAs(csv, deck.name);
  };

export const _saveAs = (content: string, name: string) => {
  if (!name.endsWith(".csv")) {
    name += ".csv";
  }
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, name);
};

export const downloadCsvSampleText = (): ThunkResult => async () => {
  _saveAs(C.CSV_SAMPLE_TEXT, "sample.csv");
};

export const spliteCreate =
  (deckName: string, cards: Card[]): ThunkResult =>
  async (dispatch, getState) => {
    const [newCards, oldCards] = splitByUniqueKey(cards, getState().card);
    await dispatch(action.card.bulkUpdate(oldCards));
    let deck = selector.deck.findByName(deckName)(getState());
    if (deck == null) {
      const deckId = await dispatch(action.deck.create(deckName));
      deck = getState().deck.byId[deckId] ?? null;
      if (deck == null) throw Error("invalid deck id");
    }
    await dispatch(action.card.bulkCreate(newCards, deck));
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
    if (deck.url == null || deck.url == "") throw Error("no deck url");
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

export const splitByUniqueKey = (cards: Card[], state: CardState): [CardRaw[], Card[]] => {
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
