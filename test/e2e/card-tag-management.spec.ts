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

test("CARD-TAG-MANAGEMENT-01 directly edits only the current Card and persists on Save", async ({
  fixture,
  page,
  namespace,
}) => {
  const { card, allCards, before, changed, frontText } =
    await test.step("Given: A saved card and unchanged neighboring cards", async () => {
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
      return { card, allCards, before, changed, frontText };
    });
  const { backText, name } = await test.step("When: Edit its text and type a tag rename", async () => {
    await frontText.fill(changed.frontText);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    const backText = page.getByRole("textbox", { name: "Back text" });
    await backText.fill(changed.backText);
    await openTags(page);
    const name = page.getByRole("textbox", { name: "Tag name 1", exact: true });
    await name.fill("rename");
    await name.press("d");
    return { backText, name };
  });
  await test.step("Then: The tag input retains typing focus and its value", async () => {
    await expect(name).toBeFocused();
    await expect(name).toHaveValue("renamed");
  });
  await test.step("When: Add surrounding spaces to the tag draft", async () => {
    await name.fill(" renamed ");
  });
  await test.step("Then: Whitespace stays in the draft", async () => {
    await expect(name).toHaveValue(" renamed ");
  });
  await test.step("When: Press Enter in the tag input", async () => {
    await name.press("Enter");
  });
  await test.step("Then: The draft remains focused and no card is saved", async () => {
    await expect(name).toBeFocused();
    await expect(name).toHaveValue(" renamed ");
    await expect(page).toHaveURL(`/card/${card.id}/edit`);
    expect(await Promise.all(allCards.map((item) => requireDocument("card", item.id)))).toEqual(before);
  });
  await test.step("When: Close the tag editor", async () => {
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
  });
  await test.step("Then: The back-text draft remains intact", async () => {
    await expect(backText).toHaveValue(changed.backText);
  });
  await test.step("When: Switch to the front-text editor", async () => {
    await page.getByRole("tab", { name: "Front", exact: true }).click();
  });
  await test.step("Then: The front-text draft remains intact", async () => {
    await expect(frontText).toHaveValue(changed.frontText);
  });
  await test.step("When: Reopen tags and remove the second tag", async () => {
    await openTags(page);
    await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
  });
  await test.step("Then: Only one tag input remains", async () => {
    await expect(page.getByRole("textbox", { name: /^Tag name / })).toHaveCount(1);
  });
  await test.step("When: Add and select the same tag with surrounding spaces", async () => {
    await addTag(page, " renamed ");
    await page.locator('label:has(input[type="checkbox"][value=" renamed "])').click();
  });
  await test.step("Then: Duplicate selection reuses the normalized tag", async () => {
    await expect(page.getByRole("textbox", { name: /^Tag name / })).toHaveCount(1);
    await expect(name).toHaveValue("renamed");
  });
  await test.step("When: Add a new tag draft", async () => {
    await addTag(page, " new tag ");
  });
  await test.step("Then: Focus moves to the new tag input", async () => {
    await expect(page.getByRole("textbox", { name: "Tag name 2", exact: true })).toBeFocused();
  });
  await test.step("When: Remove the new tag through its label", async () => {
    await page.getByRole("dialog").getByText("new tag", { exact: true }).click();
  });
  await test.step("Then: The new tag input is removed", async () => {
    await expect(page.getByRole("textbox", { name: /^Tag name / })).toHaveCount(1);
  });
  await test.step("When: Add the new tag again", async () => {
    await addTag(page, " new tag ");
  });
  await test.step("Then: Tag drafts still do not save the card", async () => {
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect(await Promise.all(allCards.map((item) => requireDocument("card", item.id)))).toEqual(before);
  });
  await test.step("When: Save the card with its tag edits", async () => {
    await saveCard(page, card.deckId);
  });
  await test.step("Then: Only the current card text and normalized tags are saved", async () => {
    await expect.poll(() => readTags(card.id)).toEqual(["renamed", "new tag"]);

    const saved = await requireDocument("card", card.id);
    expect(saved.fields.frontText?.stringValue).toBe(changed.frontText);
    expect(saved.fields.backText?.stringValue).toBe(changed.backText);
    const otherCards = allCards.filter((item) => item.id !== card.id);
    expect(await Promise.all(otherCards.map((item) => requireDocument("card", item.id)))).toEqual(
      before.filter((_, index) => allCards[index]?.id !== card.id)
    );
    expect((await requireDocument("deck", card.deckId)).fields.tags).toBeUndefined();
  });
  await test.step("When: Reload and reopen the card editor", async () => {
    await page.reload();
    await page.goto(`/card/${card.id}/edit`);
  });
  await test.step("Then: The saved front text is restored", async () => {
    await expect(frontText).toHaveValue(changed.frontText);
  });
  await test.step("When: Switch to the back-text editor", async () => {
    await page.getByRole("tab", { name: "Back", exact: true }).click();
  });
  await test.step("Then: The saved back text is restored", async () => {
    await expect(backText).toHaveValue(changed.backText);
  });
  await test.step("When: Reopen the tag editor", async () => {
    await openTags(page);
  });
  await test.step("Then: Both saved tag names are restored", async () => {
    await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("renamed");
    await expect(page.getByRole("textbox", { name: "Tag name 2", exact: true })).toHaveValue("new tag");
  });
});

test("CARD-TAG-MANAGEMENT-02 discards tag drafts with the Card", async ({ fixture, page }) => {
  const { card, before } = await test.step("Given: A saved card with its tag editor open", async () => {
    await fixture.apply(page);
    const card = fixture.card("card-target-first");
    const before = await requireDocument("card", card.id);
    await page.goto(`/card/${card.id}/edit`);
    await openTags(page);
    return { card, before };
  });
  await test.step("When: Edit tag drafts and discard the card changes", async () => {
    await page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill("draft");
    await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
    await addTag(page, "unsaved");
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await page.getByRole("button", { name: "tango", exact: true }).click();
    await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  });
  await test.step("Then: Navigation completes without saving the drafts", async () => {
    await expect(page).toHaveURL(/\/$/);
    expect(await requireDocument("card", card.id)).toEqual(before);
  });
  await test.step("When: Reopen the card tag editor", async () => {
    await page.goto(`/card/${card.id}/edit`);
    await openTags(page);
  });
  await test.step("Then: The original tag name is restored", async () => {
    await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("shared");
  });
});

for (const invalid of [" ", "kept", " kept "]) {
  test(`CARD-TAG-MANAGEMENT-03 validates tag name ${JSON.stringify(invalid)} without confirmation`, async ({
    fixture,
    page,
  }) => {
    const { card, input } = await test.step("Given: A saved card with editable tag names", async () => {
      await fixture.apply(page);
      const card = fixture.card("card-target-first");
      await page.goto(`/card/${card.id}/edit`);
      await openTags(page);
      const input = page.getByRole("textbox", { name: "Tag name 1", exact: true });
      return { card, input };
    });
    await test.step("When: Enter the invalid tag name and leave the input", async () => {
      await input.fill(invalid);
      await input.press("Tab");
    });
    await test.step("Then: The appropriate tag validation error is shown", async () => {
      await expect(page.getByRole("alert")).toContainText(
        invalid === " " ? "Tag name is required." : "Tag names must be unique."
      );
    });
    await test.step("When: Try to save the invalid tag draft", async () => {
      await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
    });
    await test.step("Then: The card remains unsaved in the editor", async () => {
      await expect(page).toHaveURL(`/card/${card.id}/edit`);
      expect(await readTags(card.id)).toEqual(card.tags);
    });
    await test.step("When: Correct the tag name and save again", async () => {
      await openTags(page);
      await input.fill("corrected");
      await saveCard(page, card.deckId);
    });
    await test.step("Then: The corrected tags are saved", async () => {
      await expect.poll(() => readTags(card.id)).toEqual(["corrected", "kept"]);
    });
  });
}

test("CARD-TAG-MANAGEMENT-04 filters the Card tag union and removes an unused candidate", async ({ fixture, page }) => {
  const { card } = await test.step("Given: A deck with shared and card-specific tags", async () => {
    await fixture.apply(page);
    const card = fixture.card("card-target-first");
    await page.goto(`/deck/${card.deckId}`);
    return { card };
  });
  await test.step("When: Open the deck filters", async () => {
    await page.locator("summary").filter({ hasText: "Filters" }).click();
  });
  await test.step("Then: Candidates come only from the current deck cards", async () => {
    await expect(page.getByRole("checkbox", { name: "shared", exact: true })).toHaveCount(1);
    await expect(page.getByRole("checkbox", { name: "other-only", exact: true })).toHaveCount(0);
  });
  await test.step("When: Filter by the tag used by one card", async () => {
    await page.getByRole("checkbox", { name: "kept", exact: true }).locator("xpath=parent::label").click();
  });
  await test.step("Then: Only the matching card remains", async () => {
    await expect(page.getByRole("button", { name: /^View / })).toHaveCount(1);
  });
  await test.step("When: Open the filtered deck in View mode", async () => {
    await page.goto(`/deck/${card.deckId}/view`);
  });
  await test.step("Then: Viewing contains one matching card", async () => {
    await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 1");
  });
  await test.step("When: Remove that tag from its last card and save", async () => {
    await page.goto(`/card/${card.id}/edit`);
    await openTags(page);
    await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
    await saveCard(page, card.deckId);
  });
  await test.step("Then: The active filter now matches no cards", async () => {
    await expect(page.getByRole("button", { name: /^View / })).toHaveCount(0);
  });
  await test.step("When: Reopen the deck filters", async () => {
    await page.locator("summary").filter({ hasText: "Filters" }).click();
  });
  const { kept } = await test.step("Then: The unused selected tag remains available to clear", async () => {
    const kept = page.getByRole("checkbox", { name: "kept", exact: true });
    await expect(kept).toBeChecked();
    return { kept };
  });
  await test.step("When: Clear the unused tag selection", async () => {
    await kept.locator("xpath=parent::label").click();
  });
  await test.step("Then: The unused candidate disappears and both cards return", async () => {
    await expect(kept).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^View / })).toHaveCount(2);
  });
  await test.step("When: Open the unfiltered deck in View mode", async () => {
    await page.goto(`/deck/${card.deckId}/view`);
  });
  await test.step("Then: Viewing contains both cards again", async () => {
    await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 2");
  });
});

test("CARD-TAG-MANAGEMENT-05 keeps offline Card tag edits across reload and reconnect", async ({
  fixture,
  page,
  context,
  browserErrors,
  baseURL,
}) => {
  const { card, other, stopServingWorker } =
    await test.step("Given: A remote card editor with a cached app shell", async () => {
      await fixture.apply(page);
      const card = fixture.card("card-target-first");
      const other = fixture.card("card-target-second");
      await page.goto(`/card/${card.id}/edit`);
      const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
      await page.reload();
      await expect(page.getByRole("button", { name: "Edit tags", exact: true })).toBeVisible();
      return { card, other, stopServingWorker };
    });
  await test.step("When: Go offline, edit a tag and submit the card", async () => {
    await stopServingWorker();
    allowOfflineErrors(browserErrors);
    await context.setOffline(true);
    await openTags(page);
    await page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill("offline");
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
  });
  await test.step("Then: The remote edit waits for server acceptance", async () => {
    await expect(page).toHaveURL(`/card/${card.id}/edit`);
    await expect(page.getByRole("button", { name: "Saving…", exact: true })).toBeDisabled();
  });
  await test.step("When: Reload offline and reopen the tags", async () => {
    await page.reload();
    await openTags(page);
  });
  await test.step("Then: The editor restores the previously saved tag", async () => {
    await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("shared");
  });
  await test.step("When: Reconnect the browser", async () => {
    await context.setOffline(false);
  });
  await test.step("Then: The pending tag edit syncs without leaving the editor", async () => {
    await expect.poll(() => readTags(card.id)).toEqual(["offline", "kept"]);
    await expect(page).toHaveURL(`/card/${card.id}/edit`);
  });
  await test.step("When: Open the deck card list", async () => {
    await page.goto(`/deck/${card.deckId}`);
  });
  await test.step("Then: The synchronized tag is visible", async () => {
    await expect(
      page.getByRole("article").filter({ hasText: card.frontText }).getByText("offline", { exact: true })
    ).toBeVisible();
  });
  await test.step("When: Reopen and reload the card tag editor", async () => {
    await page.goto(`/card/${card.id}/edit`);
    await page.reload();
    await openTags(page);
  });
  await test.step("Then: The saved tag survives reload and other cards stay unchanged", async () => {
    await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("offline");
    expect(await readTags(other.id)).toEqual(other.tags);
  });
});

test("CARD-TAG-MANAGEMENT-06 keeps anonymous tags locally across offline reload", async ({
  fixture,
  page,
  context,
  browserErrors,
  baseURL,
}) => {
  const { deck, first, stopServingWorker } =
    await test.step("Given: An anonymous card editor with a cached app shell", async () => {
      await fixture.apply(page, { auth: { linked: false } });
      const { deck, first } = await createAnonymousDeck(page);
      await page.goto(`/card/${first.id}/edit`);
      const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
      await page.reload();
      await expect(page.getByRole("button", { name: "Edit tags", exact: true })).toBeVisible();
      return { deck, first, stopServingWorker };
    });
  await test.step("When: Go offline, edit a local tag and reopen the card", async () => {
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
  });
  await test.step("Then: Local saving completes without server acceptance", async () => {
    await expect(page).toHaveURL(`/card/${first.id}/edit`);
  });
  await test.step("When: Reload offline and reopen the tags", async () => {
    await page.reload();
    await openTags(page);
  });
  await test.step("Then: The local tag edit survives reload", async () => {
    await expect(page.getByRole("textbox", { name: /^Tag name / }).last()).toHaveValue("local-edited");
  });
  await test.step("When: Reconnect the anonymous browser", async () => {
    await context.setOffline(false);
  });
  await test.step("Then: The deck and card remain absent from remote storage", async () => {
    expect(await getDocument("deck", deck.id)).toBeUndefined();
    expect(await getDocument("card", first.id)).toBeUndefined();
  });
});
