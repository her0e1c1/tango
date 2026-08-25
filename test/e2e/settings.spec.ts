import {
  createRemoteCardFixture,
  createRemoteDeckFixture,
  expect,
  routeAnonymousAuth,
  seedConfig,
  seedDeckAndCards,
  test,
} from "./fixtures";

test("SETTINGS-01 Dark mode is auto-saved across reload", async ({ page, namespace }) => {
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);
  await page.goto("/settings");

  const darkMode = page.getByRole("checkbox", { name: "Dark mode" });
  await expect(darkMode).not.toBeChecked();
  await darkMode.locator("xpath=parent::label").click();
  await expect(darkMode).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.appearance?.darkMode
      )
    )
    .toBe(true);

  await page.reload();
  await expect(darkMode).toBeChecked();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("SETTINGS-02 Maximum cards limits the next study session", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = Array.from({ length: 4 }, (_, index) =>
    createRemoteCardFixture(namespace, deck.id, {
      id: namespace.id(`card-${String(index)}`),
      frontText: `${namespace.caseId} front ${String(index)}`,
      backText: `${namespace.caseId} back ${String(index)}`,
      uniqueKey: namespace.id(`key-${String(index)}`),
    })
  );
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);
  await seedDeckAndCards(deck, cards);
  await page.goto("/settings");

  const maximumCards = page.getByRole("slider", { name: "Maximum cards" });
  await maximumCards.fill("2");
  await expect(maximumCards).toHaveValue("2");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.study?.maxNumberOfCardsToLearn
      )
    )
    .toBe(2);

  await page.reload();
  await expect(maximumCards).toHaveValue("2");
  await page.goto(`/deck/${deck.id}/start`);
  await expect(page.getByRole("heading", { level: 2, name: "2 cards in this session" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start 2 cards" })).toBeVisible();
});
