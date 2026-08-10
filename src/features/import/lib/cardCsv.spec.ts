/**
 * @file Verifies the "deck action" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should prepare deck",
 * "parses string content as raw cards", "rejects unsupported input at the parser boundary".
 */
import type { CardRaw } from "@/entities/card";
import { prepareDeck } from "@/entities/deck";

import { expect, expectTypeOf, it, describe, vi, beforeEach, afterEach } from "vitest";

// import moment from "moment";
import * as fileSaver from "file-saver";

import { createBlobConstructor } from "@/shared/testing";
import { createCard } from "@/entities/card";

import { downloadCsvSample, downloadDeckData, parseCardCsv } from "./cardCsv";
import { CSV_SAMPLE_TEXT } from "./sampleCsv";

vi.mock("./firestore");
vi.mock("@/shared/firebase", () => ({ auth: { currentUser: null } }));
vi.mock("@/shared/auth", () => ({ publishAuthenticatedUser: vi.fn() }));
vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));
vi.mock("firebase/firestore");

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
      expect(prepareDeck({ name: "name" }, "uid", () => "deck-id")).toMatchObject({
        id: "deck-id",
        name: "name",
        uid: "uid",
      });
    });
  });

  describe("parseCsv", () => {
    it("parses string content as raw cards", async () => {
      const cards = await parseCardCsv("front,back");

      expectTypeOf(cards).toEqualTypeOf<CardRaw[]>();
      expect(cards).toEqual([{ frontText: "front", backText: "back", uniqueKey: "", tags: [] }]);
    });

    it("rejects unsupported input at the parser boundary", async () => {
      await expect(parseCardCsv({ content: "front,back" })).rejects.toThrow("CSV content must be a string or File");
    });

    it("keeps the bundled sample safe for identical re-imports", async () => {
      const cards = await parseCardCsv(CSV_SAMPLE_TEXT);

      expect(cards).toHaveLength(3);
      expect(cards.map((card) => card.uniqueKey)).toEqual([
        "question-answer-example",
        "hello-world-python",
        "circle-area",
      ]);
    });
  });

  describe("download", () => {
    it("downloads the supplied Query data", () => {
      const blob = new Blob();
      const blobConstructor = vi.spyOn(global, "Blob");
      blobConstructor.mockImplementation(createBlobConstructor(blob));
      const deck = prepareDeck({ name: "Remote deck" }, "uid", () => "deck-id");
      const card = createCard({ frontText: "remote front", backText: "remote back", uniqueKey: "remote-key" });

      downloadDeckData(deck, [card]);

      expect(blobConstructor).toHaveBeenCalledWith(["remote front,remote back,,remote-key"], {
        type: "text/plain;charset=utf-8",
      });
      expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "Remote deck.csv");
    });

    it("escapes spreadsheet formulae in exported card data", () => {
      const blob = new Blob();
      const blobConstructor = vi.spyOn(global, "Blob");
      blobConstructor.mockImplementation(createBlobConstructor(blob));
      const deck = prepareDeck({ name: "Formula deck" }, "uid", () => "deck-id");
      const card = createCard({
        frontText: "=1+1",
        backText: "+1+1",
        tags: ["@tag"],
        uniqueKey: "-1+1",
      });

      downloadDeckData(deck, [card]);

      expect(blobConstructor).toHaveBeenCalledWith(['"\'=1+1","\'+1+1","\'@tag","\'-1+1"'], {
        type: "text/plain;charset=utf-8",
      });
      expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "Formula deck.csv");
    });
  });

  describe("downloadCsvSampleText", () => {
    it("should download", () => {
      const blob = new Blob();
      const m = vi.spyOn(global, "Blob");
      m.mockImplementation(createBlobConstructor(blob));

      downloadCsvSample();
      expect(m).toBeCalledWith([CSV_SAMPLE_TEXT], { type: "text/plain;charset=utf-8" });
      expect(fileSaver.saveAs).toBeCalledWith(expect.anything(), "sample.csv");
    });
  });
});
