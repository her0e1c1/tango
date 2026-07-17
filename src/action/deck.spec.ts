import { expect, expectTypeOf, it, describe, vi, beforeEach, afterEach } from "vitest";

// import moment from "moment";
import * as fileSaver from "file-saver";

import * as action from "@/action";
import * as C from "@/constant";
import { createBlobConstructor, createCard } from "@/test/factories";

vi.mock("./firestore");
vi.mock("@/firebase", () => ({ auth: { currentUser: null } }));
vi.mock("@/auth/AuthContext", () => ({ publishAuthenticatedUser: vi.fn() }));
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
      expect(action.deck.prepare({ name: "name" }, "uid")).toMatchObject({
        name: "name",
        uid: "uid",
      });
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
    it("downloads the supplied Query data", () => {
      const blob = new Blob();
      const blobConstructor = vi.spyOn(global, "Blob");
      blobConstructor.mockImplementation(createBlobConstructor(blob));
      const deck = action.deck.prepare({ name: "Remote deck" }, "uid");
      const card = createCard({ frontText: "remote front", backText: "remote back", uniqueKey: "remote-key" });

      action.deck.downloadData(deck, [card]);

      expect(blobConstructor).toHaveBeenCalledWith(["remote front,remote back,,remote-key"], {
        type: "text/plain;charset=utf-8",
      });
      expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "Remote deck.csv");
    });
  });

  describe("downloadCsvSampleText", () => {
    it("should download", () => {
      const blob = new Blob();
      const m = vi.spyOn(global, "Blob");
      m.mockImplementation(createBlobConstructor(blob));

      action.deck.downloadCsvSampleText();
      expect(m).toBeCalledWith([C.CSV_SAMPLE_TEXT], { type: "text/plain;charset=utf-8" });
      expect(fileSaver.saveAs).toBeCalledWith(expect.anything(), "sample.csv");
    });
  });

  it("restores the Blob constructor after download tests", () => {
    expect(global.Blob).toBe(NativeBlob);
  });
});
