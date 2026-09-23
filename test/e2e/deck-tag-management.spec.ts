import { expect, requireDocument, test } from "./utils/fixtures";
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
  await row(page, "shared").getByRole("button", { name: "Rename", exact: true }).click();
  await section(page).getByRole("textbox", { name: "New name", exact: true }).fill(name);
  await section(page).getByRole("button", { name: "Save name", exact: true }).click();
}

async function saved(page: Page) {
  await expect(page.getByRole("status").filter({ hasText: "Tag changes saved." })).toBeVisible();
}

test("DECK-TAG-MANAGEMENT-01 lists legacy Card tags once within their Deck", async ({ fixture, page }) => {
  await fixture.apply(page);
  await page.goto(`/deck/${fixture.deck("deck-target").id}/edit`);
  await expect(section(page).getByRole("listitem")).toHaveText(["sharedRenameDelete tag", "keptRenameDelete tag"]);
  await expect(row(page, "other-only")).toHaveCount(0);
});

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
    expect(await readCard(card.id)).toEqual({
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
  await row(page, "shared").getByRole("button", { name: "Delete tag" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Delete tag?" });
  await expect(dialog).toContainText("The cards and their other tags will remain.");
  await dialog.getByRole("button", { name: "Delete tag" }).click();
  await saved(page);
  await page.reload();
  await expect(row(page, "shared")).toHaveCount(0);
  await expect(row(page, "kept")).toBeVisible();
  for (const [index, card] of cards.entries()) {
    const original = before[index];
    if (original === undefined) throw new Error("Missing original Card");
    expect(await readCard(card.id)).toEqual({
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
  await row(page, "shared").getByRole("button", { name: "Delete tag" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Delete tag?" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row(page, "shared")).toBeVisible();
  expect(await readCard(cardId)).toEqual(before);
});
