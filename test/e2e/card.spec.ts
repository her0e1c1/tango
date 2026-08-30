import type { Page } from "@playwright/test";
import {
  allowExpectedFirestoreWriteFailure,
  expect,
  failNextFirestoreWrite,
  getDocument,
  documentId,
  listDocuments,
  readLocalData,
  requireDocument,
  test,
} from "./fixtures";

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

test("CARD-01 shows front text, score, study count, and tags", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);

  const article = cardArticle(page, card.frontText);
  await expect(article.getByText(card.frontText)).toBeVisible();
  await expectScore(page, card.frontText, card.score);
  await expect(article.getByText(`studied ${String(card.numberOfSeen)} times`)).toBeVisible();
  await expect(article.getByRole("group", { name: `Tags: ${card.tags.join(", ")}` })).toBeVisible();
});

test("CARD-02 opens the selected Card back-text overlay", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: `View ${card.frontText}` }).click();

  await expect(page.getByRole("button", { name: "Close card" })).toContainText(card.backText);
});

test("CARD-03 persists edited front, back, and tags across reload", async ({ fixture, page, namespace }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  const changed = {
    frontText: `${namespace.caseId} changed front`,
    backText: `${namespace.caseId} changed back`,
  };
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Front text" }).fill(changed.frontText);
  await page.getByRole("textbox", { name: "Back text" }).fill(changed.backText);
  await clickCheckboxLabel(page, "math");
  await clickCheckboxLabel(page, "python");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByRole("status").filter({ hasText: `Updated card “${changed.frontText}”.` })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: `Open actions for ${changed.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue(changed.frontText);
  await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue(changed.backText);
  await expect(page.getByRole("checkbox", { name: "math" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "typescript" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "python" })).toBeChecked();
});
test("CARD-04 deletes a Card and does not reload it as active", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  const dialog = await openCardDeleteDialog(page, card.frontText);
  await dialog.getByRole("button", { name: "Delete card" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: `Deleted card “${card.frontText}”.` })).toBeVisible();
  await page.reload();

  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.deletedAt?.integerValue)
    .not.toBeUndefined();
});

test("CARD-05 increases score by one after a right swipe and reload", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  const expectedScore = card.score + 1;
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  await swipe(page, card.frontText, "right");
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.score?.integerValue)
    .toBe(String(expectedScore));
  await page.reload();

  await expectScore(page, card.frontText, expectedScore);
});

test("CARD-06 decreases score by one after a left swipe and reload", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  const expectedScore = card.score - 1;
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  await swipe(page, card.frontText, "left");
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.score?.integerValue)
    .toBe(String(expectedScore));
  await page.reload();

  await expectScore(page, card.frontText, expectedScore);
});

test("CARD-07 closes the back-text overlay without changing persistent Card data", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
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

test("CARD-08 cancels deletion, restores focus, and preserves persistent data", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
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

test("CARD-09 retries the same Card edit after a handled failure", async ({
  fixture,
  page,
  browserErrors,
  namespace,
}) => {
  const deck = fixture.deck();
  const card = fixture.card();
  const changedFront = `${namespace.caseId} retry front`;
  const changedBack = `${namespace.caseId} retry back`;
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await expect(page).toHaveURL(new RegExp(`/card/${card.id}/edit$`));
  const fault = await failNextFirestoreWrite(page, { collection: "card", id: card.id });
  allowExpectedFirestoreWriteFailure(browserErrors);
  await page.getByRole("textbox", { name: "Front text" }).fill(changedFront);
  await page.getByRole("textbox", { name: "Back text" }).fill(changedBack);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to save changes. Try again.");
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await fault.dispose();
  await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue(changedFront);
  await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue(changedBack);

  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: `Updated card “${changedFront}”.` })).toBeVisible();
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
    .toBe(changedFront);
  await page.reload();

  await expect(page.getByText(changedFront)).toBeVisible();
  await page.getByRole("button", { name: `View ${changedFront}` }).click();
  await expect(page.getByRole("button", { name: "Close card" })).toContainText(changedBack);
});

test("CARD-10 persists score and tag filters and applies both after reload", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const matching = fixture.card("card-1");
  const wrongTag = fixture.card("card-2");
  const lowScore = fixture.card("card-3");
  const [selectedTag] = matching.tags;
  if (selectedTag === undefined) throw new Error("CARD-10 fixture requires a matching Card tag");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  await page.getByText("Filters", { exact: true }).click();
  await page.getByRole("combobox", { name: "Minimum score" }).selectOption("1");
  await clickCheckboxLabel(page, selectedTag);
  await expect.poll(async () => (await requireDocument("deck", deck.id)).fields.scoreMin?.integerValue).toBe("1");
  await expect
    .poll(async () => (await requireDocument("deck", deck.id)).fields.selectedTags?.arrayValue?.values?.length)
    .toBe(1);
  await page.reload();

  await expect(page.getByText("score ≥ 1 · 1 tag")).toBeVisible();
  await page.getByText("Filters", { exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Minimum score" })).toHaveValue("1");
  await expect(page.getByRole("checkbox", { name: selectedTag })).toBeChecked();
  await expect(page.getByRole("button", { name: `View ${matching.frontText}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${lowScore.frontText}` })).toHaveCount(0);
  await expect(page.getByRole("button", { name: `View ${wrongTag.frontText}` })).toHaveCount(0);
  const persisted = await requireDocument("deck", deck.id);
  expect(persisted.fields.selectedTags?.arrayValue?.values).toEqual([{ stringValue: selectedTag }]);
});

test("CARD-11 opens a Card view route inside the application shell", async ({ fixture, page }) => {
  const card = fixture.card();
  await fixture.apply(page);

  await page.goto(`/card/${card.id}`);

  await expect(page.getByRole("region", { name: "Card answer" })).toContainText(card.backText);
  await expect(page.getByRole("button", { name: "tango" })).toBeVisible();
});

test("CARD-12 recovers home from a missing Card route", async ({ fixture, page, namespace }) => {
  await fixture.apply(page);

  await page.goto(`/card/${namespace.id("missing")}`);
  await expect(page.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  expect(await getDocument("card", namespace.id("missing"))).toBeUndefined();
});

test("CARD-13 creates one remote Card and keeps it across reload", async ({ fixture, page, namespace }) => {
  const deck = fixture.deck();
  const frontText = `${namespace.caseId} remote front`;
  const backText = `${namespace.caseId} remote back`;
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: "Add card" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));
  await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
  await page.getByRole("textbox", { name: "Back text" }).fill(backText);
  await page.getByRole("button", { name: "Create card" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByRole("status").filter({ hasText: `Created card “${frontText}”.` })).toBeVisible();
  await page.reload();

  await expect(page.getByRole("button", { name: `View ${frontText}` })).toBeVisible();
  const created = (await listDocuments("card")).filter(
    (document) =>
      document.fields.deckId?.stringValue === deck.id &&
      document.fields.uid?.stringValue === deck.uid &&
      document.fields.frontText?.stringValue === frontText
  );
  expect(created).toHaveLength(1);
  const [createdCard] = created;
  if (createdCard === undefined) throw new Error("Created remote Card was not found");
  expect(createdCard.fields.deckId?.stringValue).toBe(deck.id);
  expect(createdCard.fields.uid?.stringValue).toBe(deck.uid);
  expect(createdCard.fields.uniqueKey?.stringValue).toBe(documentId(createdCard));
  expect((await readLocalData(page)).cards).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ frontText })])
  );
});

test("CARD-14 creates one local Card and keeps it across reload", async ({ fixture, page, namespace }) => {
  const deck = fixture.deck();
  const frontText = `${namespace.caseId} local front`;
  const backText = `${namespace.caseId} local back`;
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: "Add card" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));
  await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
  await page.getByRole("textbox", { name: "Back text" }).fill(backText);
  await page.getByRole("button", { name: "Create card" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByRole("status").filter({ hasText: `Created card “${frontText}”.` })).toBeVisible();
  await page.reload();

  await expect(page.getByRole("button", { name: `View ${frontText}` })).toBeVisible();
  const localCards = (await readLocalData(page)).cards.filter(
    (card: { deckId?: string; frontText?: string }) => card.deckId === deck.id && card.frontText === frontText
  );
  expect(localCards).toHaveLength(1);
  expect(localCards[0]).toEqual(expect.objectContaining({ deckId: deck.id, uniqueKey: localCards[0]?.id }));
  expect(
    (await listDocuments("card")).filter(
      (document) =>
        document.fields.deckId?.stringValue === deck.id && document.fields.frontText?.stringValue === frontText
    )
  ).toEqual([]);
});
