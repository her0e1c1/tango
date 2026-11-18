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

test("CARD-TAG-MANAGEMENT-01 saves only the current Card text and tags across reload", async ({
  fixture,
  page,
  namespace,
}) => {
  const { card, allCards, before, changed } =
    await test.step("Given: A saved card and unchanged neighboring cards", async () => {
      await fixture.apply(page);
      const card = fixture.card("card-target-first");
      const allCards = fixture.state.remote.cards;
      const before = await Promise.all(allCards.map((item) => requireDocument("card", item.id)));
      const changed = { frontText: `${namespace.caseId} edited front`, backText: `${namespace.caseId} edited back` };
      await page.goto(`/card/${card.id}/edit`);
      return { card, allCards, before, changed };
    });
  await test.step("When: Change both sides and tags and save the Card", async () => {
    await page.getByRole("textbox", { name: "Front text" }).fill(changed.frontText);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(changed.backText);
    await openTags(page);
    await page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill("renamed");
    await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
    await addTag(page, "new tag");
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
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue(changed.frontText);
  });
  await test.step("When: Switch to the back-text editor", async () => {
    await page.getByRole("tab", { name: "Back", exact: true }).click();
  });
  await test.step("Then: The saved back text is restored", async () => {
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue(changed.backText);
  });
  await test.step("When: Reopen the tag editor", async () => {
    await openTags(page);
  });
  await test.step("Then: Both saved tag names are restored", async () => {
    await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("renamed");
    await expect(page.getByRole("textbox", { name: "Tag name 2", exact: true })).toHaveValue("new tag");
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
