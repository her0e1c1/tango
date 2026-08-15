import { beforeEach, describe, expect, it } from "vitest";

import { createDeck } from "@/test/factories";
import { deckStore } from "../model/store";
import { createLocalDeck, deleteLocalDeck, editLocalDeck } from "./local";

describe("local Deck persistence", () => {
  beforeEach(() => deckStore.setState({ remoteDecks: [], localDecks: [] }));

  it("creates, edits, and deletes only local state", async () => {
    const remote = createDeck({ id: "remote" });
    deckStore.setState({ remoteDecks: [remote] });

    await createLocalDeck({ id: "local", uid: "local", name: "Local" });
    expect(deckStore.getState().localDecks[0]).toMatchObject({ id: "local", localMode: true });

    await editLocalDeck({ id: "local", name: "Edited" });
    expect(deckStore.getState().localDecks[0]?.name).toBe("Edited");

    await deleteLocalDeck({ id: "local" });
    expect(deckStore.getState()).toEqual({ remoteDecks: [remote], localDecks: [] });
  });
});
