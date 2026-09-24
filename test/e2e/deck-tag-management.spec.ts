import { expect, getDocument, requireDocument, setDocument, test, type BrowserErrorCollector } from "./utils/fixtures";
import { installApplicationCacheForOfflineReload } from "./utils/offline-cache";
import { createAnonymousDeck } from "./utils/ui-helpers";
import type { Page } from "@playwright/test";

const section = (page: Page) => page.getByRole("region", { name: "Tag management" });
const row = (page: Page, name: string) => section(page).getByRole("listitem", { name, exact: true });

async function readCard(id: string) {
  const { fields } = await requireDocument("card", id);
  return {
    frontText: fields.frontText?.stringValue,
    backText: fields.backText?.stringValue,
    tags: fields.tags?.arrayValue?.values?.map((value) => value.stringValue) ?? [],
    deletedAt: fields.deletedAt,
  };
}

async function rename(page: Page, name: string) {
  await row(page, "shared").getByRole("button", { name: "Rename shared", exact: true }).click();
  await section(page).getByRole("textbox", { name: "New name", exact: true }).fill(name);
  await section(page).getByRole("button", { name: "Save name", exact: true }).click();
}

async function saved(page: Page) {
  await expect(page.getByRole("status").filter({ hasText: "Tag changes saved." })).toBeVisible();
}

test("DECK-TAG-MANAGEMENT-01 lists legacy Card tags once within their Deck", async ({ fixture, page }) => {
  await fixture.apply(page);
  await page.goto(`/deck/${fixture.deck("deck-target").id}/edit`);
  await expect(section(page).getByRole("listitem")).toHaveText(["sharedUsed by 2 cards", "keptUsed by 1 card"]);
  await expect(row(page, "other-only")).toHaveCount(0);
});

test("DECK-TAG-MANAGEMENT-01 keeps icon actions directly accessible on a narrow screen", async ({ fixture, page }) => {
  await fixture.apply(page);
  const deck = fixture.deck("deck-target");
  const longTag = "A-long-tag-name-without-spaces-that-needs-to-wrap-on-a-small-phone";
  await setDocument("deck", deck.id, { ...deck, deletedAt: null, tags: [longTag] });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(`/deck/${deck.id}/edit`);
  await expect(row(page, longTag)).toContainText("Used by 0 cards");
  for (const name of [longTag, "shared", "kept"]) {
    const tagRow = row(page, name);
    for (const action of [`Rename ${name}`, `Delete tag ${name}`]) {
      const button = tagRow.getByRole("button", { name: action, exact: true });
      await expect(button).toBeEnabled();
      await expect(button).toHaveText("");
      const bounds = await button.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds?.width).toBeGreaterThanOrEqual(48);
      expect(bounds?.height).toBeGreaterThanOrEqual(48);
      expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(320);
    }
  }
  await row(page, longTag)
    .getByRole("button", { name: `Rename ${longTag}`, exact: true })
    .click();
  await expect(row(page, longTag).getByRole("textbox", { name: "New name", exact: true })).toBeFocused();
  await section(page).getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(row(page, longTag).getByRole("button", { name: `Rename ${longTag}`, exact: true })).toBeFocused();
});

for (const action of ["Rename shared", "Delete tag shared"]) {
  test(`DECK-TAG-MANAGEMENT-18 recovers when the active tag disappears after ${action}`, async ({ fixture, page }) => {
    await fixture.apply(page);
    const deck = fixture.deck("deck-target");
    await page.goto(`/deck/${deck.id}/edit`);
    await row(page, "shared").getByRole("button", { name: action, exact: true }).click();
    for (const card of fixture.state.remote.cards.filter((candidate) => candidate.deckId === deck.id)) {
      await setDocument("card", card.id, {
        ...card,
        tags: card.tags.filter((tag) => tag !== "shared"),
        deletedAt: null,
      });
    }
    await expect(row(page, "shared")).toHaveCount(0);
    const cancel = section(page).getByRole("button", { name: "Cancel", exact: true });
    await expect(cancel).toBeFocused();
    await cancel.click();
    await expect(section(page).getByRole("button", { name: "Add tag", exact: true })).toBeEnabled();
    await expect(row(page, "kept").getByRole("button", { name: "Rename kept", exact: true })).toBeEnabled();
  });
}

test("DECK-TAG-MANAGEMENT-02 shows an empty list with an available add action", async ({ fixture, page }) => {
  await fixture.apply(page);
  await page.goto(`/deck/${fixture.deck("deck-empty").id}/edit`);
  await expect(section(page).getByText("No tags yet.")).toBeVisible();
  await expect(section(page).getByRole("listitem")).toHaveCount(0);
  await expect(section(page).getByRole("button", { name: "Add tag" })).toBeEnabled();
});

for (const finish of ["save", "cancel"]) {
  test(`DECK-TAG-MANAGEMENT-03 retains an empty Deck tag independently of draft ${finish}`, async ({
    fixture,
    page,
  }) => {
    await fixture.apply(page);
    const otherId = fixture.card("card-other").id;
    const other = await readCard(otherId);
    const deck = fixture.deck("deck-empty");
    await page.goto(`/deck/${deck.id}/edit`);
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("Unsaved deck name");
    await section(page).getByRole("textbox", { name: "New tag name" }).fill("shared");
    await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
    await section(page).getByRole("button", { name: "Add tag" }).click();
    await saved(page);
    await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Unsaved deck name");
    expect((await requireDocument("deck", deck.id)).fields.name?.stringValue).toBe(deck.name);
    if (finish === "save") {
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
    } else {
      await page.getByRole("button", { name: "Back to decks", exact: true }).click();
      await page.getByRole("button", { name: "Discard changes", exact: true }).click();
    }
    await expect(page).toHaveURL(/\/$/);
    await page.goto(`/deck/${deck.id}/edit`);
    await page.reload();
    await expect(row(page, "shared")).toHaveCount(1);
    await expect(section(page).getByRole("listitem")).toHaveCount(1);
    await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(
      finish === "save" ? "Unsaved deck name" : deck.name
    );
    expect(await readCard(otherId)).toEqual(other);
  });
}

for (const name of ["", "   "]) {
  test(`DECK-TAG-MANAGEMENT-04 rejects adding a blank name ${JSON.stringify(name)}`, async ({ fixture, page }) => {
    await fixture.apply(page);
    await page.goto(`/deck/${fixture.deck("deck-target").id}/edit`);
    await section(page).getByRole("textbox", { name: "New tag name" }).fill(name);
    await section(page).getByRole("button", { name: "Add tag" }).click();
    await expect(section(page).getByRole("alert")).toHaveText("A tag name is required.");
    await expect(section(page).getByRole("listitem")).toHaveCount(2);
    await expect(section(page).getByRole("textbox", { name: "New tag name" })).toBeEditable();
  });
}

test("DECK-TAG-MANAGEMENT-05 rejects a duplicate including legacy Card tags", async ({ fixture, page }) => {
  await fixture.apply(page);
  const cardId = fixture.card("card-target-first").id;
  const before = await readCard(cardId);
  await page.goto(`/deck/${fixture.deck("deck-target").id}/edit`);
  await section(page).getByRole("textbox", { name: "New tag name" }).fill("shared");
  await section(page).getByRole("button", { name: "Add tag" }).click();
  await expect(section(page).getByRole("alert")).toHaveText("A tag with this name already exists in this deck.");
  await expect(row(page, "shared")).toHaveCount(1);
  expect(await readCard(cardId)).toEqual(before);
});

test("DECK-TAG-MANAGEMENT-06 renames all matching Cards and preserves other Decks", async ({ fixture, page }) => {
  await fixture.apply(page);
  const cards = fixture.state.remote.cards;
  const before = await Promise.all(cards.map((card) => readCard(card.id)));
  await page.goto(`/deck/${fixture.deck("deck-target").id}/edit`);
  await rename(page, "renamed");
  await saved(page);
  await page.reload();
  await expect(row(page, "renamed")).toBeVisible();
  await expect(row(page, "shared")).toHaveCount(0);
  await expect(row(page, "kept")).toBeVisible();
  for (const [index, card] of cards.entries()) {
    const original = before[index];
    if (original === undefined) throw new Error("Missing original Card");
    await expect
      .poll(() => readCard(card.id))
      .toEqual({
        ...original,
        tags:
          card.deckId === fixture.deck("deck-target").id
            ? original.tags.map((tag) => (tag === "shared" ? "renamed" : tag))
            : original.tags,
      });
  }
});

for (const name of ["", "   "]) {
  test(`DECK-TAG-MANAGEMENT-07 rejects renaming to a blank name ${JSON.stringify(name)}`, async ({ fixture, page }) => {
    await fixture.apply(page);
    const cardId = fixture.card("card-target-first").id;
    const before = await readCard(cardId);
    await page.goto(`/deck/${fixture.deck("deck-target").id}/edit`);
    await rename(page, name);
    await expect(section(page).getByRole("alert")).toHaveText("A tag name is required.");
    await expect(section(page).getByRole("textbox", { name: "New name", exact: true })).toBeEditable();
    expect(await readCard(cardId)).toEqual(before);
  });
}

test("DECK-TAG-MANAGEMENT-08 rejects renaming to another existing tag", async ({ fixture, page }) => {
  await fixture.apply(page);
  const cardId = fixture.card("card-target-first").id;
  const before = await readCard(cardId);
  await page.goto(`/deck/${fixture.deck("deck-target").id}/edit`);
  await rename(page, "kept");
  await expect(section(page).getByRole("alert")).toHaveText("A tag with this name already exists in this deck.");
  await section(page).getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(row(page, "shared")).toBeVisible();
  await expect(row(page, "kept")).toBeVisible();
  expect(await readCard(cardId)).toEqual(before);
});

test("DECK-TAG-MANAGEMENT-09 deletes only the target tag and retains every Card", async ({ fixture, page }) => {
  await fixture.apply(page);
  const cards = fixture.state.remote.cards;
  const before = await Promise.all(cards.map((card) => readCard(card.id)));
  await page.goto(`/deck/${fixture.deck("deck-target").id}/edit`);
  await row(page, "shared").getByRole("button", { name: "Delete tag shared", exact: true }).click();
  const dialog = page.getByRole("group", { name: "Delete tag?" });
  await expect(row(page, "shared").getByRole("group", { name: "Delete tag?" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
  await expect(dialog).toContainText("The cards and their other tags will remain.");
  await dialog.getByRole("button", { name: "Delete tag" }).click();
  await saved(page);
  await page.reload();
  await expect(row(page, "shared")).toHaveCount(0);
  await expect(row(page, "kept")).toBeVisible();
  for (const [index, card] of cards.entries()) {
    const original = before[index];
    if (original === undefined) throw new Error("Missing original Card");
    await expect
      .poll(() => readCard(card.id))
      .toEqual({
        ...original,
        tags:
          card.deckId === fixture.deck("deck-target").id
            ? original.tags.filter((tag) => tag !== "shared")
            : original.tags,
      });
  }
});

test("DECK-TAG-MANAGEMENT-10 cancels deletion without changing tags or Cards", async ({ fixture, page }) => {
  await fixture.apply(page);
  const cardId = fixture.card("card-target-first").id;
  const before = await readCard(cardId);
  await page.goto(`/deck/${fixture.deck("deck-target").id}/edit`);
  await row(page, "shared").getByRole("button", { name: "Delete tag shared", exact: true }).click();
  const dialog = page.getByRole("group", { name: "Delete tag?" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row(page, "shared").getByRole("button", { name: "Delete tag shared", exact: true })).toBeFocused();
  await expect(row(page, "shared")).toBeVisible();
  expect(await readCard(cardId)).toEqual(before);
});

test("DECK-TAG-MANAGEMENT-12 filters both browsing pages by an assigned Deck tag", async ({ fixture, page }) => {
  await fixture.apply(page);
  const deck = fixture.deck("deck-target");
  await setDocument("deck", deck.id, { ...deck, deletedAt: null, tags: ["kept"] });
  const cards = fixture.state.remote.cards;
  const before = await Promise.all(cards.map((card) => readCard(card.id)));
  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("button", { name: /^View / })).toHaveCount(2);
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  await page.getByRole("checkbox", { name: "kept", exact: true }).locator("xpath=parent::label").click();
  await expect(page.getByRole("button", { name: /^View / })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "View first tagged question", exact: true })).toBeVisible();
  await expect(page.getByText("1 card", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "View second tagged question", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "View other deck question", exact: true })).toHaveCount(0);
  await page.goto(`/deck/${deck.id}/view`);
  await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 1");
  await expect(page.getByRole("button", { name: "Card front", exact: true })).toHaveText("first tagged question");
  expect(await Promise.all(cards.map((card) => readCard(card.id)))).toEqual(before);
});

function allowOfflineErrors(errors: BrowserErrorCollector) {
  errors.allow(
    /console error: Failed to load resource: net::ERR_INTERNET_DISCONNECTED \[http:\/\/app\.test:4173\/tango-(?:logo|logo-dark|mark)\.svg/iu
  );
  errors.allow(/console error: .*Could not reach Cloud Firestore backend/u);
  errors.allow(
    /console error: Failed to load resource: .*ERR_INTERNET_DISCONNECTED.*\[http:\/\/(?:db|127\.0\.0\.1|localhost):[0-9]+\//iu
  );
  errors.allow(
    /console error: Failed to load resource: net::ERR_INTERNET_DISCONNECTED \[https:\/\/www\.google\.com\/images\/cleardot\.gif\?/iu
  );
}

async function openTagEditor(page: Page, deckName: string) {
  await page.getByRole("button", { name: "tango", exact: true }).click();
  await page.getByRole("button", { name: `Open actions for ${deckName}`, exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await expect(section(page)).toBeVisible();
}

async function addTag(page: Page, name: string) {
  await section(page).getByRole("textbox", { name: "New tag name" }).fill(name);
  await section(page).getByRole("button", { name: "Add tag", exact: true }).click();
  await expect(row(page, name)).toBeVisible();
}

async function deleteTag(page: Page, name: string) {
  await row(page, name)
    .getByRole("button", { name: `Delete tag ${name}`, exact: true })
    .click();
  await page
    .getByRole("group", { name: "Delete tag?" })
    .getByRole("button", { name: "Delete tag", exact: true })
    .click();
  await expect(row(page, name)).toHaveCount(0);
}

test("DECK-TAG-MANAGEMENT-13 manages cached tags offline and syncs after reconnecting", async ({
  fixture,
  page,
  context,
  browserErrors,
  baseURL,
}) => {
  await fixture.apply(page);
  const deck = fixture.deck("deck-target");
  const cards = fixture.state.remote.cards;
  const before = await Promise.all(cards.map((card) => readCard(card.id)));
  await page.goto(`/deck/${deck.id}/edit`);
  await expect(row(page, "shared")).toBeVisible();
  const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
  await page.reload();
  await expect(row(page, "shared")).toBeVisible();
  await stopServingWorker();
  allowOfflineErrors(browserErrors);
  await context.setOffline(true);
  await addTag(page, "offline");
  await rename(page, "renamed");
  await expect(row(page, "renamed")).toBeVisible();
  await deleteTag(page, "kept");
  expect(await Promise.all(cards.map((card) => readCard(card.id)))).toEqual(before);
  await page.reload();
  await expect(row(page, "offline")).toBeVisible();
  await expect(row(page, "renamed")).toBeVisible();
  await expect(row(page, "kept")).toHaveCount(0);
  await expect(row(page, "shared")).toHaveCount(0);
  await context.setOffline(false);
  for (const [index, card] of cards.entries()) {
    const original = before[index];
    if (original === undefined) throw new Error("Missing original Card");
    await expect
      .poll(() => readCard(card.id))
      .toEqual({ ...original, tags: card.deckId === deck.id ? ["renamed"] : original.tags });
  }
  await page.reload();
  await expect(row(page, "renamed")).toBeVisible();
  await expect(row(page, "shared")).toHaveCount(0);
});

for (const operation of ["rename", "delete"]) {
  test(`DECK-TAG-MANAGEMENT-14 keeps ${operation} after an earlier offline Card edit syncs`, async ({
    fixture,
    page,
    context,
    browserErrors,
  }) => {
    await fixture.apply(page);
    const deck = fixture.deck("deck-target");
    const card = fixture.card("card-target-first");
    await page.goto(`/card/${card.id}/edit`);
    await expect(page.getByRole("textbox", { name: "Front text", exact: true })).toHaveValue(card.frontText);
    allowOfflineErrors(browserErrors);
    await context.setOffline(true);
    await page.getByRole("textbox", { name: "Front text", exact: true }).fill("Pending offline text");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page).toHaveURL(`/deck/${deck.id}`);
    await openTagEditor(page, deck.name);
    if (operation === "rename") {
      await rename(page, "renamed");
    } else {
      await deleteTag(page, "shared");
    }
    await expect(row(page, "shared")).toHaveCount(0);
    expect((await readCard(card.id)).frontText).toBe(card.frontText);
    await context.setOffline(false);
    await expect
      .poll(() => readCard(card.id))
      .toEqual({
        frontText: "Pending offline text",
        backText: card.backText,
        tags: operation === "rename" ? ["renamed", "kept"] : ["kept"],
        deletedAt: { nullValue: null },
      });
    await page.reload();
    await expect(row(page, "shared")).toHaveCount(0);
    await expect(row(page, "kept")).toBeVisible();
  });
}

test("DECK-TAG-MANAGEMENT-15 manages anonymous tags locally across an offline reload", async ({
  fixture,
  page,
  context,
  browserErrors,
  baseURL,
}) => {
  await fixture.apply(page, { auth: { linked: false } });
  const { deck, first } = await createAnonymousDeck(page);
  await page.goto(`/card/${first.id}/edit`);
  await page.getByRole("button", { name: "Edit tags", exact: true }).click();
  await page.getByRole("checkbox", { name: "math", exact: true }).locator("xpath=parent::label").click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(`/deck/${deck.id}`);
  await openTagEditor(page, deck.name);
  const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
  await page.reload();
  await expect(row(page, "math")).toBeVisible();
  await stopServingWorker();
  allowOfflineErrors(browserErrors);
  await context.setOffline(true);
  await addTag(page, "kept");
  await row(page, "math").getByRole("button", { name: "Rename math", exact: true }).click();
  await section(page).getByRole("textbox", { name: "New name", exact: true }).fill("renamed");
  await section(page).getByRole("button", { name: "Save name", exact: true }).click();
  await expect(row(page, "renamed")).toBeVisible();
  await deleteTag(page, "renamed");
  await page.reload();
  await expect(row(page, "kept")).toBeVisible();
  await expect(section(page).getByRole("listitem")).toHaveCount(1);
  await context.setOffline(false);
  expect(await getDocument("deck", deck.id)).toBeUndefined();
  expect(await getDocument("card", first.id)).toBeUndefined();
  await page.goto(`/card/${first.id}/edit`);
  await expect(page.getByRole("textbox", { name: "Front text", exact: true })).toHaveValue(first.frontText);
  await page.getByRole("button", { name: "Edit tags", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "math", exact: true })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "renamed", exact: true })).toHaveCount(0);
});

test("DECK-TAG-MANAGEMENT-16 does not rewrite unchanged tag names", async ({ fixture, page }) => {
  await fixture.apply(page);
  const deck = fixture.deck("deck-target");
  const beforeDeck = await requireDocument("deck", deck.id);
  const card = fixture.card("card-target-first");
  const beforeCard = await requireDocument("card", card.id);
  await page.goto(`/deck/${deck.id}/edit`);
  await rename(page, "shared");
  await saved(page);
  expect(await requireDocument("deck", deck.id)).toEqual(beforeDeck);
  expect(await requireDocument("card", card.id)).toEqual(beforeCard);
});
