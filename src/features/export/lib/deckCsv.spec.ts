import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({ downloadTextFile: vi.fn() }));

vi.mock("@/shared/files", () => ({ downloadTextFile: mocks.downloadTextFile }));

import { downloadDeckCsv } from "./deckCsv";

describe("downloadDeckCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("downloads cards as import-compatible CSV", () => {
    const deck = createDeck({ name: "Remote deck" });
    const card = createCard({
      frontText: "remote front",
      backText: "remote back",
      tags: ["tag one", "tag two"],
      uniqueKey: "remote-key",
    });

    downloadDeckCsv(deck, [card]);

    expect(mocks.downloadTextFile).toHaveBeenCalledExactlyOnceWith(
      'remote front,remote back,"tag one,tag two",remote-key',
      "Remote deck.csv",
      "text/plain;charset=utf-8"
    );
  });

  it("escapes spreadsheet formulae in exported card data", () => {
    const deck = createDeck({ name: "Formula deck.csv" });
    const card = createCard({
      frontText: "=1+1",
      backText: "+1+1",
      tags: ["@tag"],
      uniqueKey: "-1+1",
    });

    downloadDeckCsv(deck, [card]);

    expect(mocks.downloadTextFile).toHaveBeenCalledExactlyOnceWith(
      '"\'=1+1","\'+1+1","\'@tag","\'-1+1"',
      "Formula deck.csv",
      "text/plain;charset=utf-8"
    );
  });

  it("preserves empty card columns", () => {
    const deck = createDeck({ name: "Empty" });
    const card = createCard({ frontText: "", backText: "", tags: [], uniqueKey: "" });

    downloadDeckCsv(deck, [card]);

    expect(mocks.downloadTextFile).toHaveBeenCalledExactlyOnceWith(",,,", "Empty.csv", "text/plain;charset=utf-8");
  });
});
