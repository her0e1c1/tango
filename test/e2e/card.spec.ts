import type { Page } from "@playwright/test";
import {
  createRemoteCardFixture,
  createRemoteDeckFixture,
  expect,
  expectedFirestoreWriteBrowserError,
  failNextFirestoreWrite,
  getDocument,
  requireDocument,
  routeAnonymousAuth,
  seedConfig,
  seedDeckAndCards,
  test,
  type TestNamespace,
} from "./fixtures";

const prepareRemote = async (
  page: Page,
  namespace: TestNamespace,
  deck: ReturnType<typeof createRemoteDeckFixture>,
  cards: ReturnType<typeof createRemoteCardFixture>[]
) => {
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);
  await seedDeckAndCards(deck, cards);
};

const cardArticle = (page: Page, frontText: string) =>
  page.getByRole("button", { name: `View ${frontText}`, exact: true }).locator("xpath=ancestor::article[1]");

const expectScore = async (page: Page, frontText: string, score: number) => {
  await expect(
    cardArticle(page, frontText)
      .locator("span")
      .filter({ hasText: new RegExp(`^${String(score)}$`) })
  ).toBeVisible();
};

const swipe = async (page: Page, frontText: string, direction: "left" | "right") => {
  const target = page.getByRole("button", { name: `View ${frontText}`, exact: true });
  const box = await target.boundingBox();
  if (box === null) throw new Error("Card swipe target bounding box is unavailable");
  const startX = direction === "right" ? box.x + 20 : box.x + box.width - 20;
  const endX = direction === "right" ? box.x + box.width - 20 : box.x + 20;
  const y = box.y + box.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y);
  await page.mouse.up();
};

const openCardDeleteDialog = async (page: Page, frontText: string) => {
  await page.getByRole("button", { name: `Open actions for ${frontText}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  return page.getByRole("alertdialog", { name: "Delete card?" });
};

const clickCheckboxLabel = async (page: Page, name: string) => {
  const checkbox = page.getByRole("checkbox", { name, exact: true });
  await checkbox.locator("xpath=parent::label").click();
  return checkbox;
};

test("CARD-01 shows front text, score, study count, and tags", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id, {
    score: 3,
    numberOfSeen: 4,
    tags: ["typescript", "accessibility"],
  });
  await prepareRemote(page, namespace, deck, [card]);

  await page.goto(`/deck/${deck.id}`);

  const article = cardArticle(page, card.frontText);
  await expect(article.getByText(card.frontText)).toBeVisible();
  await expectScore(page, card.frontText, 3);
  await expect(article.getByText("studied 4 times")).toBeVisible();
  await expect(article.getByRole("group", { name: "Tags: typescript, accessibility" })).toBeVisible();
});

test("CARD-02 opens the selected Card back-text overlay", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id);
  await prepareRemote(page, namespace, deck, [card]);

  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: `View ${card.frontText}` }).click();

  await expect(page.getByRole("button", { name: "Close card" })).toContainText(card.backText);
});

test("CARD-03 persists edited front, back, and tags across reload", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id, { tags: ["math", "typescript"] });
  const changed = {
    frontText: `${namespace.caseId} changed front`,
    backText: `${namespace.caseId} changed back`,
  };
  await prepareRemote(page, namespace, deck, [card]);

  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Front text" }).fill(changed.frontText);
  await page.getByRole("textbox", { name: "Back text" }).fill(changed.backText);
  await clickCheckboxLabel(page, "math");
  await clickCheckboxLabel(page, "python");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await page.reload();
  await page.getByRole("button", { name: `Open actions for ${changed.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue(changed.frontText);
  await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue(changed.backText);
  await expect(page.getByRole("checkbox", { name: "math" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "typescript" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "python" })).toBeChecked();
});
test("CARD-04 deletes a Card and does not reload it as active", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id);
  await prepareRemote(page, namespace, deck, [card]);

  await page.goto(`/deck/${deck.id}`);
  const dialog = await openCardDeleteDialog(page, card.frontText);
  await dialog.getByRole("button", { name: "Delete card" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();

  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.deletedAt?.integerValue)
    .not.toBeUndefined();
});

test("CARD-05 increases score by one after a right swipe and reload", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id, { score: 2 });
  await prepareRemote(page, namespace, deck, [card]);

  await page.goto(`/deck/${deck.id}`);
  await swipe(page, card.frontText, "right");
  await expect.poll(async () => (await requireDocument("card", card.id)).fields.score?.integerValue).toBe("3");
  await page.reload();

  await expectScore(page, card.frontText, 3);
});

test("CARD-06 decreases score by one after a left swipe and reload", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id, { score: 2 });
  await prepareRemote(page, namespace, deck, [card]);

  await page.goto(`/deck/${deck.id}`);
  await swipe(page, card.frontText, "left");
  await expect.poll(async () => (await requireDocument("card", card.id)).fields.score?.integerValue).toBe("1");
  await page.reload();

  await expectScore(page, card.frontText, 1);
});

test("CARD-07 closes the back-text overlay without changing persistent Card data", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id);
  await prepareRemote(page, namespace, deck, [card]);
  const before = await requireDocument("card", card.id);

  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: `View ${card.frontText}` }).click();
  const overlay = page.getByRole("button", { name: "Close card" });
  await expect(overlay).toContainText(card.backText);
  await overlay.click();

  await expect(overlay).toHaveCount(0);
  await expect(page.getByText(card.frontText)).toBeVisible();
  expect(await requireDocument("card", card.id)).toEqual(before);
});

test("CARD-08 cancels deletion, restores focus, and preserves persistent data", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id);
  await prepareRemote(page, namespace, deck, [card]);
  const before = await requireDocument("card", card.id);

  await page.goto(`/deck/${deck.id}`);
  const trigger = page.getByRole("button", { name: `Open actions for ${card.frontText}` });
  const dialog = await openCardDeleteDialog(page, card.frontText);
  await expect(dialog).toContainText(card.frontText);
  await expect(dialog).toContainText("cannot be undone");
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await requireDocument("card", card.id)).toEqual(before);
});

test("CARD-09 retries the same Card edit after a handled failure", async ({ page, browserErrors, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id);
  const changedFront = `${namespace.caseId} retry front`;
  const changedBack = `${namespace.caseId} retry back`;
  await prepareRemote(page, namespace, deck, [card]);

  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await expect(page).toHaveURL(new RegExp(`/card/${card.id}/edit$`));
  const fault = await failNextFirestoreWrite(page, { collection: "card", id: card.id });
  browserErrors.allow(expectedFirestoreWriteBrowserError);
  await page.getByRole("textbox", { name: "Front text" }).fill(changedFront);
  await page.getByRole("textbox", { name: "Back text" }).fill(changedBack);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Unable to save changes");
  expect(fault.wasTriggered()).toBe(true);
  await fault.dispose();
  await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue(changedFront);
  await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue(changedBack);

  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
    .toBe(changedFront);
  await page.reload();

  await expect(page.getByText(changedFront)).toBeVisible();
  await page.getByRole("button", { name: `View ${changedFront}` }).click();
  await expect(page.getByRole("button", { name: "Close card" })).toContainText(changedBack);
});

test("CARD-10 persists score and tag filters and applies both after reload", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const matching = createRemoteCardFixture(namespace, deck.id, {
    id: namespace.id("matching"),
    frontText: "matching card",
    score: 2,
    tags: ["alpha"],
  });
  const lowScore = createRemoteCardFixture(namespace, deck.id, {
    id: namespace.id("low-score"),
    frontText: "low score card",
    score: 0,
    tags: ["alpha"],
  });
  const wrongTag = createRemoteCardFixture(namespace, deck.id, {
    id: namespace.id("wrong-tag"),
    frontText: "wrong tag card",
    score: 2,
    tags: ["beta"],
  });
  await prepareRemote(page, namespace, deck, [matching, lowScore, wrongTag]);

  await page.goto(`/deck/${deck.id}`);
  await page.getByText("Filters", { exact: true }).click();
  await clickCheckboxLabel(page, "Enable minimum score");
  await page.getByRole("slider", { name: "Minimum score value" }).fill("1");
  await clickCheckboxLabel(page, "alpha");
  await expect.poll(async () => (await requireDocument("deck", deck.id)).fields.scoreMin?.integerValue).toBe("1");
  await expect
    .poll(async () => (await requireDocument("deck", deck.id)).fields.selectedTags?.arrayValue?.values?.length)
    .toBe(1);
  await page.reload();

  await expect(page.getByText("score ≥ 1 · 1 tag")).toBeVisible();
  await page.getByText("Filters", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Enable minimum score" })).toBeChecked();
  await expect(page.getByRole("slider", { name: "Minimum score value" })).toHaveValue("1");
  await expect(page.getByRole("checkbox", { name: "alpha" })).toBeChecked();
  await expect(page.getByRole("button", { name: `View ${matching.frontText}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${lowScore.frontText}` })).toHaveCount(0);
  await expect(page.getByRole("button", { name: `View ${wrongTag.frontText}` })).toHaveCount(0);
  const persisted = await requireDocument("deck", deck.id);
  expect(persisted.fields.selectedTags?.arrayValue?.values).toEqual([{ stringValue: "alpha" }]);
});

test("CARD-11 opens a Card view route inside the application shell", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id);
  await prepareRemote(page, namespace, deck, [card]);

  await page.goto(`/card/${card.id}`);

  await expect(page.getByRole("region", { name: "Card answer" })).toContainText(card.backText);
  await expect(page.getByRole("button", { name: "tango" })).toBeVisible();
});

test("CARD-12 recovers home from a missing Card route", async ({ page, namespace }) => {
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);

  await page.goto(`/card/${namespace.id("missing")}`);
  await expect(page.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  expect(await getDocument("card", namespace.id("missing"))).toBeUndefined();
});
