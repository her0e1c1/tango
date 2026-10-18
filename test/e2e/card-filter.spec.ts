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
    const { deck, before } =
      await test.step("Given: A deck with study conditions and no browsing filters", async () => {
        await fixture.apply(page);
        const deck = fixture.deck(logicalDeck);
        const before = await savedDocuments(fixture.user().uid);
        return { deck, before };
      });
    await test.step("When: Open the deck card list", async () => {
      await page.goto(`/deck/${deck.id}`);
    });
    await test.step("Then: All cards are available for browsing", async () => {
      await expectList(page, [...names]);
    });
    await test.step("When: Open the filter controls", async () => {
      await openFilters(page);
    });
    await test.step("Then: Browsing starts unfiltered and does not change saved data", async () => {
      await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
      await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
      await expectView(page, deck.id, [...names]);
      expect(await savedDocuments(fixture.user().uid)).toEqual(before);
    });
  });
}

test("CARD-FILTER-02 isolates filters when moving between decks", async ({ fixture, page }) => {
  const { deck, before } = await test.step("Given: One deck has saved AND filters and another has none", async () => {
    const deck = await setup(fixture, page);
    await seedFilter(deck, ["alpha", "beta"], true);
    const before = await savedDocuments(fixture.user().uid);
    return { deck, before };
  });
  await test.step("When: Open the filtered deck", async () => {
    await page.goto(`/deck/${deck.id}`);
  });
  const { other } = await test.step("Then: Only its matching card appears", async () => {
    await expectList(page, ["new tagged card"]);
    const other = fixture.deck("deck-future");
    return { other };
  });
  await test.step("When: Move to the other deck", async () => {
    await page.goto(`/deck/${other.id}`);
  });
  await test.step("Then: Its future card remains available", async () => {
    await expectList(page, ["future only card"]);
  });
  await test.step("When: Open the other deck filters", async () => {
    await openFilters(page);
  });
  await test.step("Then: Filters and viewing remain independent of the first deck", async () => {
    await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
    await expectView(page, other.id, ["future only card"]);
  });
  await test.step("When: Return to the filtered deck", async () => {
    await page.goto(`/deck/${deck.id}`);
  });
  await test.step("Then: Its matching card remains visible", async () => {
    await expectList(page, ["new tagged card"]);
  });
  await test.step("When: Reopen its filters", async () => {
    await openFilters(page);
  });
  await test.step("Then: The original AND selection and saved data are unchanged", async () => {
    await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
    expect(await savedDocuments(fixture.user().uid)).toEqual(before);
  });
});

test("CARD-FILTER-03 distinguishes an empty deck and offers recovery", async ({ fixture, page }) => {
  const { deck } = await test.step("Given: An empty deck card list with recovery actions", async () => {
    await fixture.apply(page);
    const deck = fixture.deck("deck-empty");
    await page.goto(`/deck/${deck.id}`);
    await expectList(page, []);
    await expect(page.getByRole("heading", { name: "No cards yet" })).toBeVisible();
    return { deck };
  });
  await test.step("When: Choose Add card", async () => {
    await page.getByRole("button", { name: "Add card", exact: true }).click();
  });
  await test.step("Then: Card creation opens for the empty deck", async () => {
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));
  });
  await test.step("When: Open the empty deck in View mode", async () => {
    await page.goto(`/deck/${deck.id}/view`);
  });
  await test.step("Then: Empty-state guidance replaces browsing controls", async () => {
    await expect(page.getByRole("heading", { name: "No cards yet" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Card front" })).toHaveCount(0);
  });
  await test.step("When: Return to the deck list", async () => {
    await page.getByRole("button", { name: "Back to deck list" }).click();
  });
  await test.step("Then: The deck list is visible", async () => {
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
  });
});

test("CARD-FILTER-04 preserves filters with no matching cards", async ({ fixture, page }) => {
  const { deck, before } = await test.step("Given: A deck with saved filters that match no cards", async () => {
    const deck = await setup(fixture, page);
    await seedFilter(deck, ["target", "other"], true);
    const before = await savedDocuments(fixture.user().uid);
    return { deck, before };
  });
  await test.step("When: Open its card list", async () => {
    await page.goto(`/deck/${deck.id}`);
  });
  await test.step("Then: The empty filtered state is distinguished from an empty deck", async () => {
    await expectList(page, []);
    await expect(page.getByRole("heading", { name: "No cards match the active filters" })).toBeVisible();
  });
  await test.step("When: Open its filter controls", async () => {
    await openFilters(page);
  });
  await test.step("Then: The saved AND filters can be cleared", async () => {
    await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Clear filters" }).first()).toBeEnabled();
  });
  await test.step("When: Open the filtered deck in View mode", async () => {
    await page.goto(`/deck/${deck.id}/view`);
  });
  await test.step("Then: No matching cards are shown and saved data stays unchanged", async () => {
    await expect(page.getByRole("heading", { name: "No cards match the current filters." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Card front" })).toHaveCount(0);
    expect(await savedDocuments(fixture.user().uid)).toEqual(before);
  });
});

for (const all of [false, true]) {
  test(`CARD-FILTER-05 restores saved ${all ? "AND" : "OR"} filters after both pages reload`, async ({
    fixture,
    page,
  }) => {
    const { deck, before } =
      await test.step("Given: An unfiltered deck card list with two selectable tags", async () => {
        const deck = await setup(fixture, page);
        const before = await savedDocuments(fixture.user().uid, deck.id);
        await page.goto(`/deck/${deck.id}`);
        await openFilters(page);
        return { deck, before };
      });
    await test.step("When: Select two tags and the scenario matching mode", async () => {
      await select(page, "alpha");
      await select(page, "beta");
      if (all) await matchAll(page);
    });
    const { names } = await test.step("Then: Only matching cards remain and the chosen filters are saved", async () => {
      await expectSaved(deck.id, ["alpha", "beta"], all);
      const names = all ? ["new tagged card"] : mixedCards.slice(0, 3);
      await expectList(page, names);
      return { names };
    });
    await test.step("When: Reload the filtered card list", async () => {
      await page.reload();
    });
    await test.step("Then: The matching cards are restored", async () => {
      await expectList(page, names);
    });
    await test.step("When: Reopen the filter controls", async () => {
      await openFilters(page);
    });
    await test.step("Then: The saved selection also survives reloading View mode", async () => {
      await expect(page.getByRole("radio", { name: all ? "All" : "Any", exact: true })).toBeChecked();
      await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
      await expectView(page, deck.id, names, true);
      expect(await savedDocuments(fixture.user().uid, deck.id)).toEqual(before);
    });
  });
}

test("CARD-FILTER-06 persists clearing to no tags and OR", async ({ fixture, page }) => {
  const { deck, before } = await test.step("Given: A deck with saved AND filters ready to clear", async () => {
    const deck = await setup(fixture, page);
    await seedFilter(deck, ["alpha", "beta"], true);
    const before = await savedDocuments(fixture.user().uid, deck.id);
    await page.goto(`/deck/${deck.id}`);
    await expectList(page, ["new tagged card"]);
    await openFilters(page);
    await expect(page.getByRole("button", { name: "Clear filters", exact: true })).toHaveCount(0);
    return { deck, before };
  });
  await test.step("When: Clear the active filters", async () => {
    await page.getByRole("button", { name: "Clear", exact: true }).click();
  });
  await test.step("Then: No tags and OR matching are saved", async () => {
    await expectSaved(deck.id, noFilter.selectedTags, noFilter.tagAndFilter);
  });
  await test.step("When: Reload the card list", async () => {
    await page.reload();
  });
  await test.step("Then: All cards are available again", async () => {
    await expectList(page, mixedCards);
  });
  await test.step("When: Reopen the filter controls", async () => {
    await openFilters(page);
  });
  await test.step("Then: Cleared filters apply to the card list and View mode", async () => {
    await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
    await expectView(page, deck.id, mixedCards);
    expect(await savedDocuments(fixture.user().uid, deck.id)).toEqual(before);
  });
});

for (const scenario of [
  { id: "CARD-FILTER-07", tags: ["target"], all: false, names: mixedCards.slice(0, 3) },
  { id: "CARD-FILTER-08", tags: ["alpha", "beta"], all: true, names: ["new tagged card"] },
  { id: "CARD-FILTER-09", tags: ["alpha", "beta"], all: false, names: mixedCards.slice(0, 3) },
]) {
  test(`${scenario.id} applies tag matching in both browsing pages`, async ({ fixture, page }) => {
    const { deck, before } = await test.step("Given: A deck with mixed tags and unfiltered browsing", async () => {
      const deck = await setup(fixture, page);
      const before = await savedDocuments(fixture.user().uid, deck.id);
      return { deck, before };
    });
    await test.step("When: Open its card list", async () => {
      await page.goto(`/deck/${deck.id}`);
    });
    await test.step("Then: All cards are initially available", async () => {
      await expectList(page, mixedCards);
    });
    await test.step("When: Select the scenario tags and matching mode", async () => {
      await openFilters(page);
      for (const tag of scenario.tags) await select(page, tag);
      if (scenario.all) await matchAll(page);
    });
    await test.step("Then: Both browsing pages apply the saved filter without other data changes", async () => {
      await expectSaved(deck.id, scenario.tags, scenario.all);
      await expectList(page, scenario.names);
      await expectView(page, deck.id, scenario.names);
      expect(await savedDocuments(fixture.user().uid, deck.id)).toEqual(before);
    });
  });
}

for (const filtered of [false, true]) {
  for (const id of ["CARD-FILTER-10", "CARD-FILTER-11"]) {
    test(`${id} sorts ${filtered ? "filtered" : "all"} cards without persisting order`, async ({ fixture, page }) => {
      const { deck, before, standard, sort } =
        await test.step("Given: A filtered or unfiltered deck in standard order", async () => {
          await fixture.apply(page);
          const deck = fixture.deck();
          if (filtered) await seedFilter(deck, ["shared"], false);
          const before = await savedDocuments(fixture.user().uid);
          await page.goto(`/deck/${deck.id}`);
          const standard = ["oldest question", "newest question", ...(filtered ? [] : ["tied question"])];
          await expectList(page, standard);
          const sort = page.getByRole("combobox", { name: "Sort order" });
          return { deck, before, standard, sort };
        });
      const { expected, rows } = await test.step("When: Select the requested sorting order", async () => {
        await sort.selectOption("newest");
        if (id === "CARD-FILTER-11") await sort.selectOption("standard");
        const expected =
          id === "CARD-FILTER-11"
            ? standard
            : ["newest question", ...(filtered ? [] : ["tied question"]), "oldest question"];
        const rows = page.getByRole("button", { name: /^View / });
        return { expected, rows };
      });
      await test.step("Then: The same cards appear in the requested order", async () => {
        for (const [index, name] of expected.entries())
          await expect(rows.nth(index)).toHaveAccessibleName(`View ${name}`);
        await expectList(page, standard);
      });
      await test.step("When: Reload the card list", async () => {
        await page.reload();
      });
      await test.step("Then: Sorting returns to standard order", async () => {
        await expect(sort).toHaveValue("standard");
      });
      await test.step("When: Open the deck in View mode", async () => {
        await page.goto(`/deck/${deck.id}/view`);
      });
      await test.step("Then: Viewing starts in standard order without saved-data changes", async () => {
        await expect(page.getByRole("button", { name: "Card front" })).toHaveText("oldest question");
        expect(await savedDocuments(fixture.user().uid)).toEqual(before);
      });
    });
  }
}
