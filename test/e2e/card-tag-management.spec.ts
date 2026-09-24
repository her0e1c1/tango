import { expect, getDocument, requireDocument, test, type BrowserErrorCollector } from "./utils/fixtures";
import { installApplicationCacheForOfflineReload } from "./utils/offline-cache";
import { createAnonymousDeck } from "./utils/ui-helpers";
import type { Page } from "@playwright/test";

async function readTags(id: string) {
  return (await requireDocument("card", id)).fields.tags?.arrayValue?.values?.map((value) => value.stringValue) ?? [];
}

async function openTags(page: Page) {
  await page.getByRole("button", { name: "Edit tags", exact: true }).click();
}

async function addTag(page: Page, name: string) {
  await page.getByRole("button", { name: "Add tag", exact: true }).click();
  await page
    .getByRole("textbox", { name: /^Tag name / })
    .last()
    .fill(name);
}

async function saveCard(page: Page, deckId: string) {
  await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(`/deck/${deckId}`);
}

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

test("CARD-TAG-MANAGEMENT-01 directly edits only the current Card and persists on Save", async ({ fixture, page }) => {
  await fixture.apply(page);
  const card = fixture.card("card-target-first");
  const allCards = fixture.state.remote.cards;
  const before = await Promise.all(allCards.map((item) => requireDocument("card", item.id)));
  await page.goto(`/card/${card.id}/edit`);
  await openTags(page);
  const name = page.getByRole("textbox", { name: "Tag name 1", exact: true });
  await name.fill("rename");
  await name.press("d");
  await expect(name).toBeFocused();
  await expect(name).toHaveValue("renamed");
  await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
  await expect(page.getByRole("textbox", { name: /^Tag name / })).toHaveCount(1);
  await addTag(page, "new");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  expect(await Promise.all(allCards.map((item) => requireDocument("card", item.id)))).toEqual(before);
  await saveCard(page, card.deckId);
  await expect.poll(() => readTags(card.id)).toEqual(["renamed", "new"]);
  const otherCards = allCards.filter((item) => item.id !== card.id);
  expect(await Promise.all(otherCards.map((item) => requireDocument("card", item.id)))).toEqual(
    before.filter((_, index) => allCards[index]?.id !== card.id)
  );
  expect((await requireDocument("deck", card.deckId)).fields.tags).toBeUndefined();
  await page.reload();
  await page.goto(`/card/${card.id}/edit`);
  await openTags(page);
  await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("renamed");
  await expect(page.getByRole("textbox", { name: "Tag name 2", exact: true })).toHaveValue("new");
});

test("CARD-TAG-MANAGEMENT-02 discards tag drafts with the Card", async ({ fixture, page }) => {
  await fixture.apply(page);
  const card = fixture.card("card-target-first");
  const before = await requireDocument("card", card.id);
  await page.goto(`/card/${card.id}/edit`);
  await openTags(page);
  await page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill("draft");
  await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
  await addTag(page, "unsaved");
  await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
  await page.getByRole("button", { name: "tango", exact: true }).click();
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await requireDocument("card", card.id)).toEqual(before);
  await page.goto(`/card/${card.id}/edit`);
  await openTags(page);
  await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("shared");
});

for (const invalid of [" ", "kept"]) {
  test(`CARD-TAG-MANAGEMENT-03 validates tag name ${JSON.stringify(invalid)} without confirmation`, async ({
    fixture,
    page,
  }) => {
    await fixture.apply(page);
    const card = fixture.card("card-target-first");
    await page.goto(`/card/${card.id}/edit`);
    await openTags(page);
    const input = page.getByRole("textbox", { name: "Tag name 1", exact: true });
    await input.fill(invalid);
    await expect(page.getByRole("alert")).toContainText(
      invalid === " " ? "Tag name is required." : "Tag names must be unique."
    );
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page).toHaveURL(`/card/${card.id}/edit`);
    expect(await readTags(card.id)).toEqual(card.tags);
    await openTags(page);
    await input.fill("corrected");
    await saveCard(page, card.deckId);
    await expect.poll(() => readTags(card.id)).toEqual(["corrected", "kept"]);
  });
}

test("CARD-TAG-MANAGEMENT-04 filters the Card tag union and removes an unused candidate", async ({ fixture, page }) => {
  await fixture.apply(page);
  const card = fixture.card("card-target-first");
  await page.goto(`/deck/${card.deckId}`);
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  await expect(page.getByRole("checkbox", { name: "shared", exact: true })).toHaveCount(1);
  await expect(page.getByRole("checkbox", { name: "other-only", exact: true })).toHaveCount(0);
  await page.getByRole("checkbox", { name: "kept", exact: true }).locator("xpath=parent::label").click();
  await expect(page.getByRole("button", { name: /^View / })).toHaveCount(1);
  await page.goto(`/deck/${card.deckId}/view`);
  await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 1");
  await page.goto(`/card/${card.id}/edit`);
  await openTags(page);
  await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
  await saveCard(page, card.deckId);
  await expect(page.getByRole("button", { name: /^View / })).toHaveCount(0);
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  const kept = page.getByRole("checkbox", { name: "kept", exact: true });
  await expect(kept).toBeChecked();
  await kept.locator("xpath=parent::label").click();
  await expect(kept).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^View / })).toHaveCount(2);
  await page.goto(`/deck/${card.deckId}/view`);
  await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 2");
});

test("CARD-TAG-MANAGEMENT-05 keeps offline Card tag edits across reload and reconnect", async ({
  fixture,
  page,
  context,
  browserErrors,
  baseURL,
}) => {
  await fixture.apply(page);
  const card = fixture.card("card-target-first");
  const other = fixture.card("card-target-second");
  await page.goto(`/card/${card.id}/edit`);
  const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
  await page.reload();
  await expect(page.getByRole("button", { name: "Edit tags", exact: true })).toBeVisible();
  await stopServingWorker();
  allowOfflineErrors(browserErrors);
  await context.setOffline(true);
  await openTags(page);
  await page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill("offline");
  await saveCard(page, card.deckId);
  await page.goto(`/card/${card.id}/edit`);
  await page.reload();
  await openTags(page);
  await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("offline");
  await context.setOffline(false);
  await expect.poll(() => readTags(card.id)).toEqual(["offline", "kept"]);
  expect(await readTags(other.id)).toEqual(other.tags);
});

test("CARD-TAG-MANAGEMENT-06 keeps anonymous tags locally across offline reload", async ({
  fixture,
  page,
  context,
  browserErrors,
  baseURL,
}) => {
  await fixture.apply(page, { auth: { linked: false } });
  const { deck, first } = await createAnonymousDeck(page);
  await page.goto(`/card/${first.id}/edit`);
  const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
  await page.reload();
  await expect(page.getByRole("button", { name: "Edit tags", exact: true })).toBeVisible();
  await stopServingWorker();
  allowOfflineErrors(browserErrors);
  await context.setOffline(true);
  await openTags(page);
  await addTag(page, "local");
  await page
    .getByRole("textbox", { name: /^Tag name / })
    .last()
    .fill("local-edited");
  await saveCard(page, deck.id);
  await page.goto(`/card/${first.id}/edit`);
  await page.reload();
  await openTags(page);
  await expect(page.getByRole("textbox", { name: /^Tag name / }).last()).toHaveValue("local-edited");
  await context.setOffline(false);
  expect(await getDocument("deck", deck.id)).toBeUndefined();
  expect(await getDocument("card", first.id)).toBeUndefined();
});
