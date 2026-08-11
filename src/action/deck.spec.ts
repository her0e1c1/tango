/**
 * @file Verifies the "deck action" contract with automated examples.
 * The examples make the expected CSV export and download behavior concrete.
 */

import { expect, it, describe, vi, beforeEach, afterEach } from "vitest";

// import moment from "moment";
import * as fileSaver from "file-saver";

import * as action from "@/action";
import { createBlobConstructor, createCard, createDeck } from "@/test/factories";

vi.mock("./firestore");
vi.mock("@/shared/firebase", () => ({ auth: { currentUser: null } }));
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

  describe("download", () => {
    it("downloads the supplied Query data", () => {
      const blob = new Blob();
      const blobConstructor = vi.spyOn(global, "Blob");
      blobConstructor.mockImplementation(createBlobConstructor(blob));
      const deck = createDeck({ name: "Remote deck" });
      const card = createCard({ frontText: "remote front", backText: "remote back", uniqueKey: "remote-key" });

      action.deck.downloadData(deck, [card]);

      expect(blobConstructor).toHaveBeenCalledWith(["remote front,remote back,,remote-key"], {
        type: "text/plain;charset=utf-8",
      });
      expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "Remote deck.csv");
    });

    it("escapes spreadsheet formulae in exported card data", () => {
      const blob = new Blob();
      const blobConstructor = vi.spyOn(global, "Blob");
      blobConstructor.mockImplementation(createBlobConstructor(blob));
      const deck = createDeck({ name: "Formula deck" });
      const card = createCard({
        frontText: "=1+1",
        backText: "+1+1",
        tags: ["@tag"],
        uniqueKey: "-1+1",
      });

      action.deck.downloadData(deck, [card]);

      expect(blobConstructor).toHaveBeenCalledWith(['"\'=1+1","\'+1+1","\'@tag","\'-1+1"'], {
        type: "text/plain;charset=utf-8",
      });
      expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "Formula deck.csv");
    });
  });
});
