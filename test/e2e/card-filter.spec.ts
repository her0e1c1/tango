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
  await setDocument("deck", deck.id, {
    ...deck,
    updatedAt: new Date(deck.updatedAt),
    deletedAt: null,
    cardFilter: { selectedTags, tagAndFilter },
  });
}

async function expectSaved(deckId: string, selectedTags: string[], tagAndFilter: boolean) {
  // Given: Use this case's inputs and any shared test setup.
  // When: Evaluate `requireDocument` as part of the following checks.
  // Then: Verify the expected result in the assertions below.
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
  // Given: Use this case's inputs and any shared test setup.
  // When: Evaluate `page.getByRole` as part of the following checks.
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: /^View / })).toHaveCount(names.length);
  for (const name of names) await expect(page.getByRole("button", { name: `View ${name}`, exact: true })).toBeVisible();
  await expect(
    page.getByText(`${names.length} ${names.length === 1 ? "card" : "cards"}`, { exact: true })
  ).toBeVisible();
}

async function expectView(page: Page, deckId: string, names: string[], reload = false) {
  // Given: Use this case's inputs and any shared test setup.
  await page.goto(`/deck/${deckId}/view`);
  // When: Exercise `page.reload` with the prepared inputs.
  if (reload) await page.reload();
  const seen: string[] = [];
  for (let index = 0; index < names.length; index += 1) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByLabel("Viewing progress")).toHaveAttribute(
      "aria-valuetext",
      `${index + 1} of ${names.length}`
    );
    // When: Exercise `page.getByRole("button", { name: "Card front" }).innerText` with the prepared inputs.
    seen.push(await page.getByRole("button", { name: "Card front" }).innerText());
    if (index + 1 < names.length) await page.getByRole("button", { name: "Next card" }).click();
  }
  // Then: Verify the expected result in the assertions below.
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
    // Given: Prepare `deck`, `before` and any shared test state below.
    await fixture.apply(page);
    const deck = fixture.deck(logicalDeck);
    const before = await savedDocuments(fixture.user().uid);
    // When: Exercise `page.goto` with the prepared inputs.
    await page.goto(`/deck/${deck.id}`);
    // Then: Verify the expected result in the assertions below.
    await expectList(page, [...names]);
    // When: Exercise `openFilters` with the prepared inputs.
    await openFilters(page);
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
    await expectView(page, deck.id, [...names]);
    expect(await savedDocuments(fixture.user().uid)).toEqual(before);
  });
}

test("CARD-FILTER-02 isolates filters when moving between decks", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `before` and any shared test state below.
  const deck = await setup(fixture, page);
  await seedFilter(deck, ["alpha", "beta"], true);
  const before = await savedDocuments(fixture.user().uid);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}`);
  // Then: Verify the expected result in the assertions below.
  await expectList(page, ["new tagged card"]);
  const other = fixture.deck("deck-future");
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${other.id}`);
  // Then: Verify the expected result in the assertions below.
  await expectList(page, ["future only card"]);
  // When: Exercise `openFilters` with the prepared inputs.
  await openFilters(page);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await expectView(page, other.id, ["future only card"]);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}`);
  // Then: Verify the expected result in the assertions below.
  await expectList(page, ["new tagged card"]);
  // When: Exercise `openFilters` with the prepared inputs.
  await openFilters(page);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
  expect(await savedDocuments(fixture.user().uid)).toEqual(before);
});

test("CARD-FILTER-03 distinguishes an empty deck and offers recovery", async ({ fixture, page }) => {
  // Given: Prepare `deck` and any shared test state below.
  await fixture.apply(page);
  const deck = fixture.deck("deck-empty");
  await page.goto(`/deck/${deck.id}`);
  await expectList(page, []);
  await expect(page.getByRole("heading", { name: "No cards yet" })).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: "Add card", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}/view`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { name: "No cards yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Card front" })).toHaveCount(0);
  // When: Exercise `page.getByRole("button", { name: "Back to deck list" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Back to deck list" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
});

test("CARD-FILTER-04 preserves filters with no matching cards", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `before` and any shared test state below.
  const deck = await setup(fixture, page);
  await seedFilter(deck, ["target", "other"], true);
  const before = await savedDocuments(fixture.user().uid);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}`);
  // Then: Verify the expected result in the assertions below.
  await expectList(page, []);
  await expect(page.getByRole("heading", { name: "No cards match the active filters" })).toBeVisible();
  // When: Exercise `openFilters` with the prepared inputs.
  await openFilters(page);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Clear filters" }).first()).toBeEnabled();
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}/view`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { name: "No cards match the current filters." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Card front" })).toHaveCount(0);
  expect(await savedDocuments(fixture.user().uid)).toEqual(before);
});

for (const all of [false, true]) {
  test(`CARD-FILTER-05 restores saved ${all ? "AND" : "OR"} filters after both pages reload`, async ({
    fixture,
    page,
  }) => {
    // Given: Prepare `deck`, `before`, `names` and any shared test state below.
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
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();
    // Then: Verify the expected result in the assertions below.
    await expectList(page, names);
    // When: Exercise `openFilters` with the prepared inputs.
    await openFilters(page);
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("radio", { name: all ? "All" : "Any", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
    await expectView(page, deck.id, names, true);
    expect(await savedDocuments(fixture.user().uid, deck.id)).toEqual(before);
  });
}

test("CARD-FILTER-06 persists clearing to no tags and OR", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `before` and any shared test state below.
  const deck = await setup(fixture, page);
  await seedFilter(deck, ["alpha", "beta"], true);
  const before = await savedDocuments(fixture.user().uid, deck.id);
  await page.goto(`/deck/${deck.id}`);
  await expectList(page, ["new tagged card"]);
  await openFilters(page);
  await expect(page.getByRole("button", { name: "Clear filters", exact: true })).toHaveCount(0);
  // When: Exercise `page.getByRole("button", { name: "Clear", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expectSaved(deck.id, noFilter.selectedTags, noFilter.tagAndFilter);
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expectList(page, mixedCards);
  // When: Exercise `openFilters` with the prepared inputs.
  await openFilters(page);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await expectView(page, deck.id, mixedCards);
  expect(await savedDocuments(fixture.user().uid, deck.id)).toEqual(before);
});

for (const scenario of [
  { id: "CARD-FILTER-07", tags: ["target"], all: false, names: mixedCards.slice(0, 3) },
  { id: "CARD-FILTER-08", tags: ["alpha", "beta"], all: true, names: ["new tagged card"] },
  { id: "CARD-FILTER-09", tags: ["alpha", "beta"], all: false, names: mixedCards.slice(0, 3) },
]) {
  test(`${scenario.id} applies tag matching in both browsing pages`, async ({ fixture, page }) => {
    // Given: Prepare `deck`, `before` and any shared test state below.
    const deck = await setup(fixture, page);
    const before = await savedDocuments(fixture.user().uid, deck.id);
    // When: Exercise `page.goto` with the prepared inputs.
    await page.goto(`/deck/${deck.id}`);
    // Then: Verify the expected result in the assertions below.
    await expectList(page, mixedCards);
    // When: Exercise `openFilters` with the prepared inputs.
    await openFilters(page);
    for (const tag of scenario.tags) await select(page, tag);
    if (scenario.all) await matchAll(page);
    // Then: Verify the expected result in the assertions below.
    await expectSaved(deck.id, scenario.tags, scenario.all);
    await expectList(page, scenario.names);
    await expectView(page, deck.id, scenario.names);
    expect(await savedDocuments(fixture.user().uid, deck.id)).toEqual(before);
  });
}

for (const filtered of [false, true]) {
  for (const id of ["CARD-FILTER-10", "CARD-FILTER-11"]) {
    test(`${id} sorts ${filtered ? "filtered" : "all"} cards without persisting order`, async ({ fixture, page }) => {
      // Given: Prepare `deck`, `before`, `standard` and any shared test state below.
      await fixture.apply(page);
      const deck = fixture.deck();
      if (filtered) await seedFilter(deck, ["shared"], false);
      const before = await savedDocuments(fixture.user().uid);
      await page.goto(`/deck/${deck.id}`);
      const standard = ["oldest question", "newest question", ...(filtered ? [] : ["tied question"])];
      await expectList(page, standard);
      const sort = page.getByRole("combobox", { name: "Sort order" });
      // When: Exercise `sort.selectOption` with the prepared inputs.
      await sort.selectOption("newest");
      if (id === "CARD-FILTER-11") await sort.selectOption("standard");
      const expected =
        id === "CARD-FILTER-11"
          ? standard
          : ["newest question", ...(filtered ? [] : ["tied question"]), "oldest question"];
      const rows = page.getByRole("button", { name: /^View / });
      // Then: Verify the expected result in the assertions below.
      for (const [index, name] of expected.entries())
        await expect(rows.nth(index)).toHaveAccessibleName(`View ${name}`);
      await expectList(page, standard);
      // When: Exercise `page.reload` with the prepared inputs.
      await page.reload();
      // Then: Verify the expected result in the assertions below.
      await expect(sort).toHaveValue("standard");
      // When: Exercise `page.goto` with the prepared inputs.
      await page.goto(`/deck/${deck.id}/view`);
      // Then: Verify the expected result in the assertions below.
      await expect(page.getByRole("button", { name: "Card front" })).toHaveText("oldest question");
      expect(await savedDocuments(fixture.user().uid)).toEqual(before);
    });
  }
}
