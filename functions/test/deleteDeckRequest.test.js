import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

import { DeckOwnershipError } from "../src/deckDeletion.js";
import { createDeleteDeckHandler } from "../src/deleteDeckRequest.js";

describe("deleteDeck callable handler", () => {
  it("requires an authenticated user", async () => {
    const handler = createDeleteDeckHandler({ deleteDeck: mock.fn() });

    await assert.rejects(handler({ data: { deckId: "deck" } }), { code: "unauthenticated" });
  });

  it("requires a Deck ID", async () => {
    const handler = createDeleteDeckHandler({ deleteDeck: mock.fn() });

    await assert.rejects(handler({ auth: { uid: "uid" }, data: {} }), { code: "invalid-argument" });
  });

  it("passes only the authenticated owner identity to the deletion service", async () => {
    const deleteDeck = mock.fn(async () => ({ status: "completed", deletedCards: 2 }));
    const handler = createDeleteDeckHandler({ deleteDeck });

    const result = await handler({ auth: { uid: "uid" }, data: { deckId: "deck", uid: "other" } });

    assert.deepEqual(result, { status: "completed", deletedCards: 2 });
    assert.deepEqual(deleteDeck.mock.calls[0].arguments, ["deck", "uid"]);
  });

  it("maps ownership failures to permission denied", async () => {
    const handler = createDeleteDeckHandler({
      deleteDeck: mock.fn(async () => {
        throw new DeckOwnershipError();
      }),
    });

    await assert.rejects(handler({ auth: { uid: "uid" }, data: { deckId: "deck" } }), {
      code: "permission-denied",
    });
  });
});
