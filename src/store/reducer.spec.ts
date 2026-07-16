import { describe, expect, it, vi } from "vitest";

vi.mock("@/action", () => ({
  deck: {
    prepare: vi.fn((value: Partial<Deck>, config: DeckConfig) => ({ ...value, ...config, id: "sample-deck" })),
  },
  card: {
    prepare: vi.fn((value: Partial<Card>, valueDeck: Deck) => ({
      ...value,
      id: value.uniqueKey ?? "sample-card",
      deckId: valueDeck.id,
      uid: valueDeck.uid,
    })),
  },
}));

import * as type from "@/action/type";
import { card, deck } from "@/store/reducer";
import { createCard, createDeck } from "@/test/factories";

describe("remote Redux mirrors", () => {
  it("replaces remote Decks while preserving local Decks and local ID collisions", () => {
    const local = createDeck({ id: "local", name: "Local", category: "local-category", localMode: true });
    const staleRemote = createDeck({ id: "stale", name: "Stale", localMode: false });
    const remoteCollision = createDeck({ id: "local", name: "Remote collision", localMode: false });
    const freshRemote = createDeck({ id: "fresh", name: "Fresh", category: "remote-category", localMode: false });
    const state: DeckState = {
      byId: { [local.id]: local, [staleRemote.id]: staleRemote },
      categories: ["stale-category"],
    };

    const result = deck(state, type.remoteDeckReplace([remoteCollision, freshRemote]));

    expect(result.byId).toEqual({ local, fresh: freshRemote });
    expect(result.categories).toEqual(["local-category", "remote-category"]);
  });

  it("removes every stale remote Deck when the replacement is empty", () => {
    const local = createDeck({ id: "local", localMode: true });
    const remote = createDeck({ id: "remote", localMode: false });

    const result = deck({ byId: { local, remote }, categories: ["stale"] }, type.remoteDeckReplace([]));

    expect(result).toEqual({ byId: { local }, categories: [] });
  });

  it("replaces remote Cards while preserving Cards in local Decks and local ID collisions", () => {
    const local = createCard({ id: "local", deckId: "local-deck", frontText: "Local", tags: ["local-tag"] });
    const staleRemote = createCard({ id: "stale", deckId: "remote-deck" });
    const remoteCollision = createCard({ id: "local", deckId: "remote-deck", frontText: "Remote collision" });
    const freshRemote = createCard({ id: "fresh", deckId: "remote-deck", tags: ["remote-tag"] });
    const state: CardState = {
      byId: { [local.id]: local, [staleRemote.id]: staleRemote },
      tags: ["stale-tag"],
    };

    const result = card(state, type.remoteCardReplace([remoteCollision, freshRemote], ["local-deck"]));

    expect(result.byId).toEqual({ local, fresh: freshRemote });
    expect(result.tags).toEqual(["local-tag", "remote-tag"]);
  });

  it("removes every stale remote Card when the replacement is empty", () => {
    const local = createCard({ id: "local", deckId: "local-deck" });
    const remote = createCard({ id: "remote", deckId: "remote-deck" });

    const result = card({ byId: { local, remote }, tags: ["stale"] }, type.remoteCardReplace([], ["local-deck"]));

    expect(result).toEqual({ byId: { local }, tags: [] });
  });
});
