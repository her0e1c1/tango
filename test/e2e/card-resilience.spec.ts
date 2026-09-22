import type { Page } from "@playwright/test";

import {
  allowExpectedFirestoreWriteFailure,
  expect,
  failNextFirestoreWrite,
  listDocuments,
  requireDocument,
  test,
} from "./fixtures";

const openCardDeleteDialog = async (page: Page, frontText: string) => {
  await page.getByRole("button", { name: `Open actions for ${frontText}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  return page.getByRole("alertdialog", { name: "Delete card?" });
};

test("CARD-MANAGEMENT-08 retries the same Card deletion after a handled failure", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  const fault = await failNextFirestoreWrite(page, { collection: "card", id: card.id });
  allowExpectedFirestoreWriteFailure(browserErrors);

  const dialog = await openCardDeleteDialog(page, card.frontText);
  await dialog.getByRole("button", { name: "Delete card" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("alert")).toContainText("A data save or sync failed.");
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await fault.dispose();
  const retryDialog = await openCardDeleteDialog(page, card.frontText);
  await retryDialog.getByRole("button", { name: "Delete card" }).click();

  await expect(retryDialog).not.toBeVisible({ timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.deletedAt?.integerValue)
    .not.toBeUndefined();
});

test("CARD-MANAGEMENT-09 confirms before discarding an unsaved Card edit", async ({ fixture, page, namespace }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  const unsavedFrontText = `${namespace.caseId} unsaved front`;
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const frontText = page.getByRole("textbox", { name: "Front text" });
  await frontText.fill(unsavedFrontText);

  await page.getByRole("button", { name: "tango" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
  await dialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(frontText).toHaveValue(unsavedFrontText);
  await page.getByRole("button", { name: "tango" }).click();
  await dialog.getByRole("button", { name: "Discard changes" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
    .toBe(card.frontText);
});

test("CARD-MANAGEMENT-11 confirms before discarding an unsaved Card create", async ({ fixture, page, namespace }) => {
  const deck = fixture.deck();
  const unsavedFrontText = `${namespace.caseId} unsaved front`;
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Add card" }).click();

  // Clean exit has no confirmation
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveURL(`/deck/${deck.id}`);

  // Dirty exit prompts confirmation
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Add card" }).click();
  const frontText = page.getByRole("textbox", { name: "Front text" });
  await frontText.fill(unsavedFrontText);

  await page.getByRole("button", { name: "Cancel" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
  await dialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(frontText).toHaveValue(unsavedFrontText);

  await page.getByRole("button", { name: "Cancel" }).click();
  await dialog.getByRole("button", { name: "Discard changes" }).click();
  await expect(page).toHaveURL(`/deck/${deck.id}`);
  await expect(page.getByRole("button", { name: `View ${unsavedFrontText}` })).toHaveCount(0);
});

const beginCardCreation = async (page: Page, deckId: string, frontText: string) => {
  await page.goto(`/deck/${deckId}`);
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Add card" }).click();
  await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
  await page.getByRole("tab", { name: "Back", exact: true }).click();
  await page.getByRole("textbox", { name: "Back text" }).fill("Pending back");
  const write = await holdCardWrite(page);
  await page.getByRole("button", { name: "Create card", exact: true }).click();
  await write.arrived;
  return write;
};

const expectCreatedCard = async (page: Page, deckId: string, frontText: string) => {
  await expect(page).toHaveURL(`/deck/${deckId}`);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Toast notifications" })).toContainText(`Created card “${frontText}”.`);
  await expect
    .poll(async () =>
      (await listDocuments("card"))
        .filter(
          (document) =>
            document.fields.deckId?.stringValue === deckId && document.fields.frontText?.stringValue === frontText
        )
        .map((document) => document.fields.backText?.stringValue)
    )
    .toEqual(["Pending back"]);
  await page.reload();
  await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toBeVisible();
};

test("CARD-MANAGEMENT-12 completes cache creation while the cloud write is pending", async ({
  fixture,
  page,
  namespace,
}) => {
  const deck = fixture.deck();
  const frontText = `${namespace.caseId} pending front`;
  await fixture.apply(page);
  const write = await beginCardCreation(page, deck.id, frontText);
  try {
    await expect(page).toHaveURL(`/deck/${deck.id}`);
    await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toBeVisible();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    write.release();
    await expectCreatedCard(page, deck.id, frontText);
  } finally {
    write.release();
  }
});

test("CARD-MANAGEMENT-13 keeps a queued creation after navigating away", async ({ fixture, page, namespace }) => {
  const deck = fixture.deck();
  const frontText = `${namespace.caseId} background front`;
  await fixture.apply(page);
  const write = await beginCardCreation(page, deck.id, frontText);
  try {
    await expect(page).toHaveURL(`/deck/${deck.id}`);
    await page.getByRole("button", { name: "tango", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    write.release();
    await expect
      .poll(async () => (await listDocuments("card")).some((item) => item.fields.frontText?.stringValue === frontText))
      .toBe(true);
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("button", { name: `Open cards in ${deck.name}`, exact: true }).click();
    await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toBeVisible();
  } finally {
    write.release();
  }
});

test("CARD-MANAGEMENT-14 reports rejected queued creation after leaving the form", async ({
  fixture,
  page,
  namespace,
  browserErrors,
}) => {
  const deck = fixture.deck();
  const frontText = `${namespace.caseId} rejected front`;
  await fixture.apply(page);
  const fault = await failNextFirestoreWrite(page, { collection: "card" });
  allowExpectedFirestoreWriteFailure(browserErrors);
  const write = await beginCardCreation(page, deck.id, frontText);
  try {
    await expect(page).toHaveURL(`/deck/${deck.id}`);
    await page.getByRole("button", { name: "tango", exact: true }).click();
    write.release();
    await fault.waitForFailure();
    await expect(page.getByRole("alert")).toContainText("A data save or sync failed.");
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("button", { name: `Open cards in ${deck.name}`, exact: true }).click();
    await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toHaveCount(0);
  } finally {
    write.release();
    await fault.dispose();
  }
});

// Hold the outgoing write without cancelling it; the SDK must still settle it after SPA navigation.
const holdCardWrite = async (page: Page, cardId = "") => {
  const arrived = Promise.withResolvers<void>();
  const released = Promise.withResolvers<void>();
  let held = false;
  await page.route("**/google.firestore.v1.Firestore/Write/channel**", async (route) => {
    const body = decodeURIComponent((route.request().postData() ?? "").replaceAll("+", "%20"));
    if (!held && body.includes(`/documents/card/${cardId}`)) {
      held = true;
      arrived.resolve();
      await released.promise;
    }
    await route.fallback();
  });
  return { arrived: arrived.promise, release: () => released.resolve() };
};
