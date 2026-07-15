import { expect, expectTypeOf, it, describe, vi, beforeEach, afterEach } from "vitest";

// import moment from "moment";
import * as fileSaver from "file-saver";

import * as firestore from "@/action/firestore";
import * as action from "@/action";
import * as C from "@/constant";
import { createBlobConstructor, createCard } from "@/test/factories";

vi.mock("./firestore");
vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));
vi.mock("firebase/firestore");

const NativeBlob = global.Blob;

describe("deck action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("prepareDeck", () => {
    it("should prepare deck", async () => {
      expect(action.deck.prepare({ name: "name" }, { uid: "uid", localMode: true })).toMatchObject({
        name: "name",
        uid: "uid",
        localMode: true,
      });
    });
  });

  describe("generateName", () => {
    const state = { byId: { 1: { name: "name" } as Deck }, categories: [] } as DeckState;

    it("should generate name", async () => {
      const name = action.deck.generateName("deckName", state);
      expect(name).toBe("deckName");
    });

    it("should generate name with _1", async () => {
      const name = action.deck.generateName("name", state);
      expect(name).toBe("name_1");
    });

    it("should generate name with _2", async () => {
      state.byId["2"] = { name: "name_1" } as Deck;
      const name = action.deck.generateName("name", state);
      expect(name).toBe("name_2");
    });
  });

  describe("create", () => {
    it("should create", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      const config = { uid: "uid", localMode: false };
      getState.mockReturnValue({ config, deck: { byId: {} } });

      const f = action.deck.create("name");
      await f(dispatch, getState, undefined);
      const deck = action.deck.prepare({ name: "name" }, config);
      expect(firestore.deck.create).lastCalledWith(deck);
    });
  });

  describe("update", () => {
    it("should update", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({ config: { uid: "uid" } });

      const d = { name: "deck" } as Deck;
      const f = action.deck.update(d);
      await f(dispatch, getState, undefined);
      expect(firestore.deck.update).lastCalledWith(d);
    });
  });

  describe("remove", () => {
    it("should remove", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({ deck: { byId: { deckId: { uid: "uid" } } } });

      const f = action.deck.remove("deckId");
      await f(dispatch, getState, undefined);
      expect(firestore.deck.remove).toHaveBeenCalledWith("deckId", "uid");
    });
  });

  describe("spliteCreate", () => {
    const deck = { name: "name", id: "1" } as Deck;
    const deckState = { byId: { "1": deck }, categories: [] } as DeckState;
    const cardState = { byId: { 1: createCard({ id: "1", deckId: "1", uniqueKey: "a" }) }, tags: [] };
    // TODO: add test case for not existing name
    it("should splite & create", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({ deck: deckState, card: cardState });

      const bulkUpdate = vi.spyOn(action.card, "bulkUpdate");
      const bulkCreate = vi.spyOn(action.card, "bulkCreate");
      const create = vi.spyOn(action.deck, "create");

      const cards = [{ frontText: "front", backText: "back", tags: [], uniqueKey: "a" }] satisfies CardRaw[];
      const f = action.deck.spliteCreate("name", cards);
      await f(dispatch, getState, undefined);
      expect(bulkUpdate).lastCalledWith([{ ...cards[0], id: "1", deckId: "1" }]);
      expect(bulkCreate).toBeCalledTimes(1);
      expect(create).toBeCalledTimes(0);
      expect(dispatch).toBeCalledTimes(2);
    });
  });

  describe("parseUrl", () => {
    it("should parse url", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      getState.mockReturnValue({ config: {} });
      const spliteCreate = vi.spyOn(action.deck, "spliteCreate");
      global.fetch = vi.fn().mockReturnValue(Promise.resolve(new Response("front,back")));

      const url = "http://example.com/deck-name.csv";
      const f = action.deck.parseUrl(url);
      await f(dispatch, getState, undefined);
      expect(spliteCreate).toHaveBeenCalledWith("deck-name.csv", [
        { frontText: "front", backText: "back", uniqueKey: "", tags: [] as string[] },
      ] satisfies CardRaw[]);
      expect(dispatch).toBeCalledTimes(1);
    });
  });

  describe("parseFile", () => {
    it("should parse file", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      const spliteCreate = vi.spyOn(action.deck, "spliteCreate");

      const file = new File([new Blob(["front,back"])], "deck-name.csv");
      const f = action.deck.parseFile(file);
      await f(dispatch, getState, undefined);
      expect(spliteCreate).toHaveBeenCalledWith("deck-name.csv", [
        { frontText: "front", backText: "back", uniqueKey: "", tags: [] as string[] },
      ] satisfies CardRaw[]);
      expect(dispatch).toBeCalledTimes(1);
    });
  });

  describe("parseCsv", () => {
    it("parses string content as raw cards", async () => {
      const cards = await action.deck.parseCsv("front,back");

      expectTypeOf(cards).toEqualTypeOf<CardRaw[]>();
      expect(cards).toEqual([{ frontText: "front", backText: "back", uniqueKey: "", tags: [] }]);
    });

    it("rejects unsupported input at the parser boundary", async () => {
      await expect(action.deck.parseCsv({ content: "front,back" })).rejects.toThrow(
        "CSV content must be a string or File"
      );
    });
  });

  describe("download", () => {
    it("should download", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      const blob = new Blob();
      const m = vi.spyOn(global, "Blob"); // FIXME: affect Blob after this test
      m.mockImplementation(createBlobConstructor(blob));
      getState.mockReturnValue({ deck: { byId: { id: { name: "name", cardIds: [] } } }, card: { byId: {} } });

      const f = action.deck.download("id");
      await f(dispatch, getState, undefined);
      expect(m).toBeCalledWith([""], { type: "text/plain;charset=utf-8" });
      expect(fileSaver.saveAs).toBeCalledWith(expect.anything(), "name.csv");
    });
  });

  describe("downloadCsvSampleText", () => {
    it("should download", async () => {
      const [dispatch, getState] = [vi.fn(), vi.fn()];
      const blob = new Blob();
      const m = vi.spyOn(global, "Blob");
      m.mockImplementation(createBlobConstructor(blob));

      const f = action.deck.downloadCsvSampleText();
      await f(dispatch, getState, undefined);
      expect(m).toBeCalledWith([C.CSV_SAMPLE_TEXT], { type: "text/plain;charset=utf-8" });
      expect(fileSaver.saveAs).toBeCalledWith(expect.anything(), "sample.csv");
    });
  });

  it("restores the Blob constructor after download tests", () => {
    expect(global.Blob).toBe(NativeBlob);
  });
});
