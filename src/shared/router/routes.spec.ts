import { describe, expect, it } from "vitest";

import { routes } from "./routes";

describe("routes", () => {
  it("defines every page route and builds its destination", () => {
    expect([
      [routes.deckList.path, routes.deckList.to()],
      [routes.cardList.path, routes.cardList.to("deck-id")],
      [routes.deckForm.path, routes.deckForm.to("deck-id")],
      [routes.deckStudyStart.path, routes.deckStudyStart.to("deck-id")],
      [routes.deckStudy.path, routes.deckStudy.to("deck-id")],
      [routes.cardView.path, routes.cardView.to("card-id")],
      [routes.cardForm.path, routes.cardForm.to("card-id")],
      [routes.account.path, routes.account.to()],
      [routes.settings.path, routes.settings.to()],
      [routes.deckImport.path, routes.deckImport.to()],
      [routes.notFound.path],
    ]).toEqual([
      ["/", "/"],
      ["/deck/:id", "/deck/deck-id"],
      ["/deck/:id/edit", "/deck/deck-id/edit"],
      ["/deck/:id/start", "/deck/deck-id/start"],
      ["/deck/:id/study", "/deck/deck-id/study"],
      ["/card/:id", "/card/card-id"],
      ["/card/:id/edit", "/card/card-id/edit"],
      ["/account", "/account"],
      ["/settings", "/settings"],
      ["/import", "/import"],
      ["*"],
    ]);
  });
});
