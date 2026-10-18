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
  // Given: Use this case's inputs and any shared test setup.
  // When: Exercise `page.getByRole("button", { name: "Close tag editor", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
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

test("CARD-TAG-MANAGEMENT-01 directly edits only the current Card and persists on Save", async ({
  fixture,
  page,
  namespace,
}) => {
  // Given: Prepare `card`, `allCards`, `before` and any shared test state below.
  await fixture.apply(page);
  const card = fixture.card("card-target-first");
  const allCards = fixture.state.remote.cards;
  const before = await Promise.all(allCards.map((item) => requireDocument("card", item.id)));
  const changed = {
    frontText: `${namespace.caseId} edited front`,
    backText: `${namespace.caseId} edited back`,
  };
  await page.goto(`/card/${card.id}/edit`);
  const frontText = page.getByRole("textbox", { name: "Front text" });
  // When: Exercise `frontText.fill` with the prepared inputs.
  await frontText.fill(changed.frontText);
  await page.getByRole("tab", { name: "Back", exact: true }).click();
  const backText = page.getByRole("textbox", { name: "Back text" });
  await backText.fill(changed.backText);
  await openTags(page);
  const name = page.getByRole("textbox", { name: "Tag name 1", exact: true });
  await name.fill("rename");
  await name.press("d");
  // Then: Verify the expected result in the assertions below.
  await expect(name).toBeFocused();
  await expect(name).toHaveValue("renamed");
  // When: Exercise `name.fill` with the prepared inputs.
  await name.fill(" renamed ");
  // Then: Verify the expected result in the assertions below.
  await expect(name).toHaveValue(" renamed ");
  // When: Exercise `name.press` with the prepared inputs.
  await name.press("Enter");
  // Then: Verify the expected result in the assertions below.
  await expect(name).toBeFocused();
  await expect(name).toHaveValue(" renamed ");
  await expect(page).toHaveURL(`/card/${card.id}/edit`);
  expect(await Promise.all(allCards.map((item) => requireDocument("card", item.id)))).toEqual(before);
  // When: Exercise `page.getByRole("button", { name: "Close tag editor", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(backText).toHaveValue(changed.backText);
  // When: Exercise `page.getByRole("tab", { name: "Front", exact: true }).click` with the prepared inputs.
  await page.getByRole("tab", { name: "Front", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(frontText).toHaveValue(changed.frontText);
  // When: Exercise `openTags` with the prepared inputs.
  await openTags(page);
  await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("textbox", { name: /^Tag name / })).toHaveCount(1);
  // When: Exercise `addTag` with the prepared inputs.
  await addTag(page, " renamed ");
  await page.locator('label:has(input[type="checkbox"][value=" renamed "])').click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("textbox", { name: /^Tag name / })).toHaveCount(1);
  await expect(name).toHaveValue("renamed");
  // When: Exercise `addTag` with the prepared inputs.
  await addTag(page, " new tag ");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("textbox", { name: "Tag name 2", exact: true })).toBeFocused();
  // When: Exercise `page.getByRole("dialog").getByText("new tag", { exact: true }).click` with the prepared inputs.
  await page.getByRole("dialog").getByText("new tag", { exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("textbox", { name: /^Tag name / })).toHaveCount(1);
  // When: Exercise `addTag` with the prepared inputs.
  await addTag(page, " new tag ");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  expect(await Promise.all(allCards.map((item) => requireDocument("card", item.id)))).toEqual(before);
  // When: Exercise `saveCard` with the prepared inputs.
  await saveCard(page, card.deckId);
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => readTags(card.id)).toEqual(["renamed", "new tag"]);

  const saved = await requireDocument("card", card.id);
  // Then: Verify the expected result in the assertions below.
  expect(saved.fields.frontText?.stringValue).toBe(changed.frontText);
  expect(saved.fields.backText?.stringValue).toBe(changed.backText);
  const otherCards = allCards.filter((item) => item.id !== card.id);
  expect(await Promise.all(otherCards.map((item) => requireDocument("card", item.id)))).toEqual(
    before.filter((_, index) => allCards[index]?.id !== card.id)
  );
  expect((await requireDocument("deck", card.deckId)).fields.tags).toBeUndefined();
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  await page.goto(`/card/${card.id}/edit`);
  // Then: Verify the expected result in the assertions below.
  await expect(frontText).toHaveValue(changed.frontText);
  // When: Exercise `page.getByRole("tab", { name: "Back", exact: true }).click` with the prepared inputs.
  await page.getByRole("tab", { name: "Back", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(backText).toHaveValue(changed.backText);
  // When: Exercise `openTags` with the prepared inputs.
  await openTags(page);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("renamed");
  await expect(page.getByRole("textbox", { name: "Tag name 2", exact: true })).toHaveValue("new tag");
});

test("CARD-TAG-MANAGEMENT-02 discards tag drafts with the Card", async ({ fixture, page }) => {
  // Given: Prepare `card`, `before` and any shared test state below.
  await fixture.apply(page);
  const card = fixture.card("card-target-first");
  const before = await requireDocument("card", card.id);
  await page.goto(`/card/${card.id}/edit`);
  await openTags(page);
  // When: Exercise `page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill` with the prepared inputs.
  await page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill("draft");
  await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
  await addTag(page, "unsaved");
  await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
  await page.getByRole("button", { name: "tango", exact: true }).click();
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  expect(await requireDocument("card", card.id)).toEqual(before);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/card/${card.id}/edit`);
  await openTags(page);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("shared");
});

for (const invalid of [" ", "kept", " kept "]) {
  test(`CARD-TAG-MANAGEMENT-03 validates tag name ${JSON.stringify(invalid)} without confirmation`, async ({
    fixture,
    page,
  }) => {
    // Given: Prepare `card`, `input` and any shared test state below.
    await fixture.apply(page);
    const card = fixture.card("card-target-first");
    await page.goto(`/card/${card.id}/edit`);
    await openTags(page);
    const input = page.getByRole("textbox", { name: "Tag name 1", exact: true });
    // When: Exercise `input.fill` with the prepared inputs.
    await input.fill(invalid);
    await input.press("Tab");
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("alert")).toContainText(
      invalid === " " ? "Tag name is required." : "Tag names must be unique."
    );
    // When: Exercise `page.getByRole("button", { name: "Close tag editor", exact: true }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(`/card/${card.id}/edit`);
    expect(await readTags(card.id)).toEqual(card.tags);
    // When: Exercise `openTags` with the prepared inputs.
    await openTags(page);
    await input.fill("corrected");
    await saveCard(page, card.deckId);
    // Then: Verify the expected result in the assertions below.
    await expect.poll(() => readTags(card.id)).toEqual(["corrected", "kept"]);
  });
}

test("CARD-TAG-MANAGEMENT-04 filters the Card tag union and removes an unused candidate", async ({ fixture, page }) => {
  // Given: Prepare `card` and any shared test state below.
  await fixture.apply(page);
  const card = fixture.card("card-target-first");
  await page.goto(`/deck/${card.deckId}`);
  // When: Exercise `page.locator("summary").filter({ hasText: "Filters" }).click` with the prepared inputs.
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("checkbox", { name: "shared", exact: true })).toHaveCount(1);
  await expect(page.getByRole("checkbox", { name: "other-only", exact: true })).toHaveCount(0);
  // When: Apply the operation or event under test.
  await page.getByRole("checkbox", { name: "kept", exact: true }).locator("xpath=parent::label").click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: /^View / })).toHaveCount(1);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${card.deckId}/view`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 1");
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/card/${card.id}/edit`);
  await openTags(page);
  await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
  await saveCard(page, card.deckId);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: /^View / })).toHaveCount(0);
  // When: Exercise `page.locator("summary").filter({ hasText: "Filters" }).click` with the prepared inputs.
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  const kept = page.getByRole("checkbox", { name: "kept", exact: true });
  // Then: Verify the expected result in the assertions below.
  await expect(kept).toBeChecked();
  // When: Exercise `kept.locator("xpath=parent::label").click` with the prepared inputs.
  await kept.locator("xpath=parent::label").click();
  // Then: Verify the expected result in the assertions below.
  await expect(kept).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^View / })).toHaveCount(2);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${card.deckId}/view`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 2");
});

test("CARD-TAG-MANAGEMENT-05 keeps offline Card tag edits across reload and reconnect", async ({
  fixture,
  page,
  context,
  browserErrors,
  baseURL,
}) => {
  // Given: Prepare `card`, `other`, `stopServingWorker` and any shared test state below.
  await fixture.apply(page);
  const card = fixture.card("card-target-first");
  const other = fixture.card("card-target-second");
  await page.goto(`/card/${card.id}/edit`);
  const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Edit tags", exact: true })).toBeVisible();
  // When: Exercise `stopServingWorker` with the prepared inputs.
  await stopServingWorker();
  allowOfflineErrors(browserErrors);
  await context.setOffline(true);
  await openTags(page);
  await page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill("offline");
  await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(`/card/${card.id}/edit`);
  await expect(page.getByRole("button", { name: "Saving…", exact: true })).toBeDisabled();
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  await openTags(page);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("shared");
  // When: Exercise `context.setOffline` with the prepared inputs.
  await context.setOffline(false);
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => readTags(card.id)).toEqual(["offline", "kept"]);
  await expect(page).toHaveURL(`/card/${card.id}/edit`);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${card.deckId}`);
  // Then: Verify the expected result in the assertions below.
  await expect(
    page.getByRole("article").filter({ hasText: card.frontText }).getByText("offline", { exact: true })
  ).toBeVisible();
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/card/${card.id}/edit`);
  await page.reload();
  await openTags(page);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("offline");
  expect(await readTags(other.id)).toEqual(other.tags);
});

test("CARD-TAG-MANAGEMENT-06 keeps anonymous tags locally across offline reload", async ({
  fixture,
  page,
  context,
  browserErrors,
  baseURL,
}) => {
  // Given: Prepare `stopServingWorker` and any shared test state below.
  await fixture.apply(page, { auth: { linked: false } });
  const { deck, first } = await createAnonymousDeck(page);
  await page.goto(`/card/${first.id}/edit`);
  const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Edit tags", exact: true })).toBeVisible();
  // When: Exercise `stopServingWorker` with the prepared inputs.
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
  await page.getByRole("button", { name: `Open actions for ${first.frontText}`, exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(`/card/${first.id}/edit`);
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  await openTags(page);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("textbox", { name: /^Tag name / }).last()).toHaveValue("local-edited");
  // When: Exercise `context.setOffline` with the prepared inputs.
  await context.setOffline(false);
  // Then: Verify the expected result in the assertions below.
  expect(await getDocument("deck", deck.id)).toBeUndefined();
  expect(await getDocument("card", first.id)).toBeUndefined();
});
