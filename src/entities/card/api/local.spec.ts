import { beforeEach, describe, expect, it } from "vitest";

import { createCard } from "@/test/factories";
import { cardStore } from "../model/store";
import { createLocalCard, deleteLocalCard, deleteLocalCardsByDeckId, editLocalCard } from "./local";

describe("local Card persistence", () => {
  beforeEach(() => cardStore.setState({ remoteCards: [], localCards: [] }));

  it("creates, edits, and deletes only local state", async () => {
    const remote = createCard({ id: "remote" });
    deckLocalCards([remote]);

    await createLocalCard({
      id: "local",
      deckId: "deck",
      uid: "local",
      frontText: "Front",
      backText: "Back",
      tags: [],
      uniqueKey: "key",
    });
    await editLocalCard({ id: "local", uid: "local", frontText: "Edited" });
    expect(cardStore.getState().localCards.find((card) => card.id === "local")?.frontText).toBe("Edited");

    await deleteLocalCard({ id: "local" });
    expect(cardStore.getState().remoteCards).toEqual([remote]);
  });

  it("deletes all local Cards for a Deck", async () => {
    cardStore.setState({
      localCards: [createCard({ id: "a", deckId: "deck" }), createCard({ id: "b", deckId: "other" })],
    });
    await deleteLocalCardsByDeckId("deck");
    expect(cardStore.getState().localCards.map((card) => card.id)).toEqual(["b"]);
  });
});

const deckLocalCards = (remoteCards: ReturnType<typeof createCard>[]): void => {
  cardStore.setState({ remoteCards });
};
