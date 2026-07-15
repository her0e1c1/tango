// import moment from "moment";
import { saveAs } from "file-saver";
import * as Papa from "papaparse";

import * as type from "@/action/type";
import * as C from "@/constant";
import type { ThunkResult } from "@/action/index";
import * as action from "@/action";
import * as selector from "@/selector";
import * as firestore from "@/action/firestore";
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
    scoreMax: null,
    scoreMin: null,
    isPublic: false,
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
    const name = generateName(deckName, getState().deck);
    const deck = prepare({ name } as Deck, getState().config);
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
    const deck = selector.deck.getById(deckId)(getState());
    if (!deck.localMode) {
      void firestore.deck.remove(deckId, deck.uid); // fire&forget
    }
    await dispatch(type.deckDelete(deckId));
  };

export const download =
  (id: string): ThunkResult =>
  async (_dispatch, getState) => {
    const cards = selector.card.getAllByDeckId(id)(getState());
    const csv = Papa.unparse(cards.map(action.card.toRow));
    const deck = selector.deck.getById(id)(getState());
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
  (deckName: string, cards: CardRaw[]): ThunkResult =>
  async (dispatch, getState) => {
    const [newCards, oldCards] = selector.card.splitByUniqueKey(cards)(getState());
    await dispatch(action.card.bulkUpdate(oldCards));
    let deckId = selector.deck.findByName(deckName)(getState());
    if (deckId == null) {
      deckId = await dispatch(action.deck.create(deckName));
    }
    await dispatch(action.card.bulkCreate(newCards, deckId));
    process.env.NODE_ENV !== "production" &&
      console.log(
        (deckId == null ? "CREATE" : "UPATE") +
          ` ${deckName} DECK WITH NEW ${newCards.length} AND OLD ${oldCards.length} CARDS`
      );
  };

export const reimport =
  (id: string): ThunkResult =>
  async (dispatch, getState) => {
    const deck = getState().deck.byId[id];
    if (deck == null) throw Error("invalid deck id");
    if (deck.url == null || deck.url === "") throw Error("no deck url");
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
    await dispatch(action.deck.spliteCreate(deckName, sampleCards));
    await dispatch(type.configUpdate({ loadSample: false }));
  }
};

export const parseFile =
  (file: File): ThunkResult =>
  async (dispatch) => {
    const cards = await parseCsv(file);
    await dispatch(action.deck.spliteCreate(file.name, cards));
  };

export const parseCsv = async (content: unknown): Promise<CardRaw[]> => {
  if (typeof content !== "string" && !(typeof File !== "undefined" && content instanceof File)) {
    throw new TypeError("CSV content must be a string or File");
  }
  return await new Promise((resolve) =>
    Papa.parse(content, {
      complete: async (results: { data: string[][] }) => {
        const cards = results.data.map(action.card.fromRow).filter((c) => !action.card.isEmpty(c));
        resolve(cards);
      },
    })
  );
};
