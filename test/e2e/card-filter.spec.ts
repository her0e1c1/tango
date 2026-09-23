import type { Page } from "@playwright/test";
import { expect, listDocuments, requireDocument, setDocument, test, type E2EFixture } from "./utils/fixtures";
import type { FixtureDeck } from "./utils/yaml-fixture";

const noFilter = { selectedTags: [] as string[], tagAndFilter: false };
const mixedCards = ["due tagged card", "future tagged card", "new tagged card", "excluded study tag card"];

const savedDocuments = async (uid: string, mutableDeck?: string) =>
  Promise.all(
    (["deck", "card", "studySession", "studyAnswer"] as const).map(async (collection) =>
      (await listDocuments(collection))
        .filter(({ fields }) => fields.uid?.stringValue === uid)
        .map((document) => {
          if (collection !== "deck" || !document.name.endsWith(`/${mutableDeck}`)) return document;
          const { cardFilter: _filter, updatedAt: _updatedAt, ...fields } = document.fields;
          return { name: document.name, fields };
        })
    )
  );

async function seedFilter(deck: FixtureDeck, selectedTags: string[], tagAndFilter: boolean) {
  await setDocument("deck", deck.id, { ...deck, deletedAt: null, cardFilter: { selectedTags, tagAndFilter } });
}

async function expectSaved(deckId: string, selectedTags: string[], tagAndFilter: boolean) {
  await expect
    .poll(async () => (await requireDocument("deck", deckId)).fields.cardFilter)
    .toEqual({
      mapValue: {
        fields: {
          selectedTags: {
            arrayValue: selectedTags.length ? { values: selectedTags.map((stringValue) => ({ stringValue })) } : {},
          },
          tagAndFilter: { booleanValue: tagAndFilter },
        },
      },
    });
}

async function expectList(page: Page, names: string[]) {
  await expect(page.getByRole("button", { name: /^View / })).toHaveCount(names.length);
  for (const name of names) await expect(page.getByRole("button", { name: `View ${name}`, exact: true })).toBeVisible();
  await expect(
    page.getByText(`${names.length} ${names.length === 1 ? "card" : "cards"}`, { exact: true })
  ).toBeVisible();
}

async function expectView(page: Page, deckId: string, names: string[], reload = false) {
  await page.goto(`/deck/${deckId}/view`);
  if (reload) await page.reload();
  const seen: string[] = [];
  for (let index = 0; index < names.length; index += 1) {
    await expect(page.getByLabel("Viewing progress")).toHaveAttribute(
      "aria-valuetext",
      `${index + 1} of ${names.length}`
    );
    seen.push(await page.getByRole("button", { name: "Card front" }).innerText());
    if (index + 1 < names.length) await page.getByRole("button", { name: "Next card" }).click();
  }
  expect(seen.toSorted((a, b) => a.localeCompare(b))).toEqual(names.toSorted((a, b) => a.localeCompare(b)));
}

async function openFilters(page: Page) {
  await page.locator("summary").filter({ hasText: "Filters" }).click();
}

async function select(page: Page, tag: string) {
  await page.getByRole("checkbox", { name: tag, exact: true }).locator("xpath=parent::label").click();
}

async function matchAll(page: Page) {
  await page.getByRole("radio", { name: "All", exact: true }).locator("xpath=parent::label").click();
}

async function setup(fixture: E2EFixture, page: Page) {
  await fixture.apply(page);
  return fixture.deck("deck-mixed");
}

for (const [logicalDeck, names] of [
  ["deck-mixed", mixedCards],
  ["deck-future", ["future only card"]],
] as const) {
  test(`CARD-FILTER-01 browses all cards independently of study conditions in ${logicalDeck}`, async ({
    fixture,
    page,
  }) => {
    await fixture.apply(page);
    const deck = fixture.deck(logicalDeck);
    const before = await savedDocuments(fixture.user().uid);
    await page.goto(`/deck/${deck.id}`);
    await expectList(page, [...names]);
    await openFilters(page);
    await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
    await expectView(page, deck.id, [...names]);
    expect(await savedDocuments(fixture.user().uid)).toEqual(before);
  });
}

test("CARD-FILTER-02 isolates filters when moving between decks", async ({ fixture, page }) => {
  const deck = await setup(fixture, page);
  await seedFilter(deck, ["alpha", "beta"], true);
  const before = await savedDocuments(fixture.user().uid);
  await page.goto(`/deck/${deck.id}`);
  await expectList(page, ["new tagged card"]);
  const other = fixture.deck("deck-future");
  await page.goto(`/deck/${other.id}`);
  await expectList(page, ["future only card"]);
  await openFilters(page);
  await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await expectView(page, other.id, ["future only card"]);
  await page.goto(`/deck/${deck.id}`);
  await expectList(page, ["new tagged card"]);
  await openFilters(page);
  await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
  expect(await savedDocuments(fixture.user().uid)).toEqual(before);
});

test("CARD-FILTER-03 distinguishes an empty deck and offers recovery", async ({ fixture, page }) => {
  await fixture.apply(page);
  const deck = fixture.deck("deck-empty");
  await page.goto(`/deck/${deck.id}`);
  await expectList(page, []);
  await expect(page.getByRole("heading", { name: "No cards yet" })).toBeVisible();
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));
  await page.goto(`/deck/${deck.id}/view`);
  await expect(page.getByRole("heading", { name: "No cards yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Card front" })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to deck list" }).click();
  await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
});

test("CARD-FILTER-04 preserves filters with no matching cards", async ({ fixture, page }) => {
  const deck = await setup(fixture, page);
  await seedFilter(deck, ["target", "other"], true);
  const before = await savedDocuments(fixture.user().uid);
  await page.goto(`/deck/${deck.id}`);
  await expectList(page, []);
  await expect(page.getByRole("heading", { name: "No cards match the active filters" })).toBeVisible();
  await openFilters(page);
  await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Clear filters" }).first()).toBeEnabled();
  await page.goto(`/deck/${deck.id}/view`);
  await expect(page.getByRole("heading", { name: "No cards match the current filters." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Card front" })).toHaveCount(0);
  expect(await savedDocuments(fixture.user().uid)).toEqual(before);
});

for (const all of [false, true]) {
  test(`CARD-FILTER-05 restores saved ${all ? "AND" : "OR"} filters after both pages reload`, async ({
    fixture,
    page,
  }) => {
    const deck = await setup(fixture, page);
    const before = await savedDocuments(fixture.user().uid, deck.id);
    await page.goto(`/deck/${deck.id}`);
    await openFilters(page);
    await select(page, "alpha");
    await select(page, "beta");
    if (all) await matchAll(page);
    await expectSaved(deck.id, ["alpha", "beta"], all);
    const names = all ? ["new tagged card"] : mixedCards.slice(0, 3);
    await expectList(page, names);
    await page.reload();
    await expectList(page, names);
    await openFilters(page);
    await expect(page.getByRole("radio", { name: all ? "All" : "Any", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
    await expectView(page, deck.id, names, true);
    expect(await savedDocuments(fixture.user().uid, deck.id)).toEqual(before);
  });
}

test("CARD-FILTER-06 persists clearing to no tags and OR", async ({ fixture, page }) => {
  const deck = await setup(fixture, page);
  await seedFilter(deck, ["alpha", "beta"], true);
  const before = await savedDocuments(fixture.user().uid, deck.id);
  await page.goto(`/deck/${deck.id}`);
  await expectList(page, ["new tagged card"]);
  await openFilters(page);
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expectSaved(deck.id, noFilter.selectedTags, noFilter.tagAndFilter);
  await page.reload();
  await expectList(page, mixedCards);
  await openFilters(page);
  await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await expectView(page, deck.id, mixedCards);
  expect(await savedDocuments(fixture.user().uid, deck.id)).toEqual(before);
});

for (const scenario of [
  { id: "07", tags: ["target"], all: false, names: mixedCards.slice(0, 3) },
  { id: "08", tags: ["alpha", "beta"], all: true, names: ["new tagged card"] },
  { id: "09", tags: ["alpha", "beta"], all: false, names: mixedCards.slice(0, 3) },
]) {
  test(`CARD-FILTER-${scenario.id} applies tag matching in both browsing pages`, async ({ fixture, page }) => {
    const deck = await setup(fixture, page);
    const before = await savedDocuments(fixture.user().uid, deck.id);
    await page.goto(`/deck/${deck.id}`);
    await expectList(page, mixedCards);
    await openFilters(page);
    for (const tag of scenario.tags) await select(page, tag);
    if (scenario.all) await matchAll(page);
    await expectSaved(deck.id, scenario.tags, scenario.all);
    await expectList(page, scenario.names);
    await expectView(page, deck.id, scenario.names);
    expect(await savedDocuments(fixture.user().uid, deck.id)).toEqual(before);
  });
}

for (const filtered of [false, true]) {
  for (const id of ["10", "11"]) {
    test(`CARD-FILTER-${id} sorts ${filtered ? "filtered" : "all"} cards without persisting order`, async ({
      fixture,
      page,
    }) => {
      await fixture.apply(page);
      const deck = fixture.deck();
      if (filtered) await seedFilter(deck, ["shared"], false);
      const before = await savedDocuments(fixture.user().uid);
      await page.goto(`/deck/${deck.id}`);
      const standard = ["oldest question", "newest question", ...(filtered ? [] : ["tied question"])];
      await expectList(page, standard);
      const sort = page.getByRole("combobox", { name: "Sort order" });
      await sort.selectOption("newest");
      if (id === "11") await sort.selectOption("standard");
      const expected =
        id === "11" ? standard : ["newest question", ...(filtered ? [] : ["tied question"]), "oldest question"];
      const rows = page.getByRole("button", { name: /^View / });
      for (const [index, name] of expected.entries())
        await expect(rows.nth(index)).toHaveAccessibleName(`View ${name}`);
      await expectList(page, standard);
      await page.reload();
      await expect(sort).toHaveValue("standard");
      await page.goto(`/deck/${deck.id}/view`);
      await expect(page.getByRole("button", { name: "Card front" })).toHaveText("oldest question");
      expect(await savedDocuments(fixture.user().uid)).toEqual(before);
    });
  }
}
