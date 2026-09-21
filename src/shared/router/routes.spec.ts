import { describe, expect, it } from "vitest";

import { routes } from "./routes";

describe("DECK-NAVIGATION-01 DECK-NAVIGATION-03 routes", () => {
  it.each([
    ["plan", "plan"],
    ["plan?draft=1", "plan%3Fdraft%3D1"],
    ["plan#draft", "plan%23draft"],
  ])("keeps %s inside one path parameter for every ID route", (id, encodedId) => {
    expect([
      routes.cardList.to(id),
      routes.cardCreate.to(id),
      routes.deckForm.to(id),
      routes.deckStudyStart.to(id),
      routes.deckStudy.to(id),
      routes.deckView.to(id),
      routes.cardView.to(id),
      routes.cardForm.to(id),
    ]).toEqual([
      `/deck/${encodedId}`,
      `/deck/${encodedId}/card/new`,
      `/deck/${encodedId}/edit`,
      `/deck/${encodedId}/start`,
      `/deck/${encodedId}/study`,
      `/deck/${encodedId}/view`,
      `/card/${encodedId}`,
      `/card/${encodedId}/edit`,
    ]);
  });

  it("defines every page route and builds its destination", () => {
    expect([
      [routes.deckList.path, routes.deckList.to()],
      [routes.deckCreate.path, routes.deckCreate.to()],
      [routes.cardList.path, routes.cardList.to("deck-id")],
      [routes.cardCreate.path, routes.cardCreate.to("deck-id")],
      [routes.deckForm.path, routes.deckForm.to("deck-id")],
      [routes.deckStudyStart.path, routes.deckStudyStart.to("deck-id")],
      [routes.deckStudy.path, routes.deckStudy.to("deck-id")],
      [routes.deckView.path, routes.deckView.to("deck-id")],
      [routes.cardView.path, routes.cardView.to("card-id")],
      [routes.cardForm.path, routes.cardForm.to("card-id")],
      [routes.account.path, routes.account.to()],
      [routes.settings.path, routes.settings.to()],
      [routes.deckImport.path, routes.deckImport.to()],
      [routes.notFound.path],
    ]).toEqual([
      ["/", "/"],
      ["/deck/new", "/deck/new"],
      ["/deck/:id", "/deck/deck-id"],
      ["/deck/:id/card/new", "/deck/deck-id/card/new"],
      ["/deck/:id/edit", "/deck/deck-id/edit"],
      ["/deck/:id/start", "/deck/deck-id/start"],
      ["/deck/:id/study", "/deck/deck-id/study"],
      ["/deck/:id/view", "/deck/deck-id/view"],
      ["/card/:id", "/card/card-id"],
      ["/card/:id/edit", "/card/card-id/edit"],
      ["/account", "/account"],
      ["/settings", "/settings"],
      ["/import", "/import"],
      ["*"],
    ]);
  });
});
