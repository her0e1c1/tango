import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ db: {} }));

import { cardStore } from "../model/store";
import { deleteCard, editCard } from "./mutations";

describe("Card mutations", () => {
  beforeEach(() => {
    cardStore.setState({ remoteCards: [], localCards: [] });
    localStorage.clear();
  });

  it("rejects edit and delete when the Card cannot be resolved", async () => {
    const card = createCardFixture({ id: "missing" });

    await expect(editCard("uid", { id: card.id, frontText: "Updated" })).rejects.toThrow(
      'Card "missing" was not found'
    );
    await expect(deleteCard("uid", card)).rejects.toThrow('Card "missing" was not found');
  });

  it("rejects edit and delete when the Card parent Deck cannot be resolved", async () => {
    const card = createCardFixture({ id: "orphan", deckId: "missing-deck" });
    cardStore.setState({ remoteCards: [card] });

    await expect(editCard("uid", { id: card.id, frontText: "Updated" })).rejects.toThrow(
      'Deck "missing-deck" was not found'
    );
    await expect(deleteCard("uid", card)).rejects.toThrow('Deck "missing-deck" was not found');
  });
});
