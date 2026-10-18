import { createAnonymousDeck, startAnonymousStudy } from "./utils/ui-helpers";
import type { Page } from "@playwright/test";
import { documentId, expect, listDocuments, test } from "./utils/fixtures";

const accountUid = async (page: Page) => {
  const value = await page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd").textContent();
  if (value == null || value.trim() === "") throw new Error("Account User ID is unavailable");
  return value.trim();
};

const openGooglePopup = async (page: Page) => {
  // The emulator's identity flow is self-contained; remote styles and Material Components only decorate it and
  // must not exhaust a test's timeout before the inline form behavior can initialize.
  await Promise.all([
    page.context().route("https://unpkg.com/**", (route) =>
      route.fulfill({
        body: "",
        contentType: route.request().url().endsWith(".js") ? "text/javascript" : "text/css",
      })
    ),
    page
      .context()
      .route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "", contentType: "text/css" })),
  ]);
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("button", { name: "Sign in with Google", exact: true }).click(),
  ]);
  await popup.waitForFunction(() => typeof Reflect.get(window, "validateForm") === "function");
  return popup;
};

const completeGooglePopup = async (page: Page, namespace: string, openedPopup?: Page) => {
  const popup = openedPopup ?? (await openGooglePopup(page));
  await popup.getByRole("button", { name: "Add new account" }).click();
  await popup.locator("#email-input").fill(`${namespace}@example.test`);
  await popup.locator("#display-name-input").fill(`E2E ${namespace}`);
  await Promise.all([
    popup.waitForEvent("close"),
    popup.getByRole("button", { name: /Sign in with Google\.com/ }).click(),
  ]);
};

const closeGooglePopup = async (page: Page) => {
  // Given: Use this case's inputs and any shared test setup.
  // When: Exercise `openGooglePopup` with the prepared inputs.
  const popup = await openGooglePopup(page);
  // Then: Verify the expected result in the assertions below.
  await expect(popup.getByRole("button", { name: "Add new account" })).toBeVisible();
  await popup.close();
};

test("ACCOUNT-01 Google linking preserves the anonymous identity and its data", async ({
  fixture,
  page,
  namespace,
}) => {
  // Given: Prepare `local`, `studyFront`, `card` and any shared test state below.
  await fixture.apply(page, { auth: false });
  const local = await createAnonymousDeck(page);
  const { deck } = local;
  const studyFront = await startAnonymousStudy(page, deck.id);
  const card = studyFront === local.first.frontText ? local.first : local.second;

  await page.goto("/account");
  await expect(page.getByText("Anonymous account")).toBeVisible();
  const anonymousUid = await accountUid(page);

  for (const collection of ["deck", "card", "studySession", "studyAnswer"] as const) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // When: Evaluate `(await listDocuments(collection)).filter` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect((await listDocuments(collection)).filter(({ fields }) => fields.uid?.stringValue === anonymousUid)).toEqual(
      []
    );
  }
  await completeGooglePopup(page, namespace.uid);
  await expect(page.getByRole("status").filter({ hasText: "Signed in." })).toBeVisible();
  await expect(page.getByText("Signed in with Google")).toBeVisible();
  await expect(page.getByText(anonymousUid, { exact: true })).toBeVisible();

  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  await page.goto("/");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(deck.name, { exact: true })).toBeVisible();
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(card.frontText, { exact: true })).toBeVisible();
  await expect
    .poll(async () =>
      (await listDocuments("deck"))
        .filter(({ fields }) => fields.uid?.stringValue === anonymousUid)
        .map((document) => ({ id: documentId(document), name: document.fields.name?.stringValue }))
    )
    .toEqual([{ id: deck.id, name: deck.name }]);
  await expect
    .poll(async () =>
      (await listDocuments("card"))
        .filter(({ fields }) => fields.uid?.stringValue === anonymousUid)
        .map((document) => ({
          id: documentId(document),
          deckId: document.fields.deckId?.stringValue,
          frontText: document.fields.frontText?.stringValue,
          backText: document.fields.backText?.stringValue,
        }))
        .sort((left, right) => left.id.localeCompare(right.id))
    )
    .toEqual(
      local.cards
        .map(({ id, frontText, backText }) => ({ id, deckId: deck.id, frontText, backText }))
        .sort((left, right) => left.id.localeCompare(right.id))
    );
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/");
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("0");
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}/study`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(card.frontText, { exact: true })).toBeVisible();
  await expect
    .poll(async () =>
      (await listDocuments("studySession"))
        .filter(({ fields }) => fields.uid?.stringValue === anonymousUid && fields.deckId?.stringValue === deck.id)
        .map(({ fields }) => ({
          index: Number(fields.currentIndex?.integerValue),
          cards: fields.cardOrderIds?.arrayValue?.values?.map((value) => value.stringValue),
        }))
    )
    .toEqual([{ index: 0, cards: [card.id, card === local.first ? local.second.id : local.first.id] }]);
});

test("ACCOUNT-02 A closed Google popup can be retried successfully", async ({ fixture, page, namespace }) => {
  // Given: Use this case's inputs and any shared test setup.
  await fixture.apply(page, { auth: false });
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/account");

  await closeGooglePopup(page);
  // Firebase polls for user-closed popups with a randomized delay of up to ten seconds.
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("alert")).toContainText("Unable to sign in.", { timeout: 12_000 });
  await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();

  // When: Exercise `completeGooglePopup` with the prepared inputs.
  await completeGooglePopup(page, namespace.uid);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Signed in." })).toBeVisible();
  await expect(page.getByText("Signed in with Google")).toBeVisible();
});

test("ACCOUNT-03 Sign-out switches to a new anonymous identity boundary", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `card` and any shared test state below.
  const deck = fixture.deck();
  const card = fixture.card("card-2");
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: `Open cards in ${deck.name}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(card.frontText, { exact: true })).toBeVisible();
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/account");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText("Signed in with Google")).toBeVisible();
  // When: Exercise `accountUid` with the prepared inputs.
  const originalUid = await accountUid(page);
  // Then: Verify the expected result in the assertions below.
  expect(originalUid).toBe(uid);

  // When: Exercise `page.getByRole("button", { name: "Sign out" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Sign out" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("status").filter({ hasText: "Signed out." })).toBeVisible();
  await expect(page.getByText("Anonymous account")).toBeVisible();
  // When: Exercise `accountUid` with the prepared inputs.
  const nextUid = await accountUid(page);
  // Then: Verify the expected result in the assertions below.
  expect(nextUid).not.toBe(originalUid);

  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(deck.name, { exact: true })).toHaveCount(0);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  await expect(page.getByText(card.frontText, { exact: true })).toHaveCount(0);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}/study`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { level: 1, name: "Study session unavailable." })).toBeVisible();
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { name: "Study session unavailable." })).toBeVisible();
});

test("ACCOUNT-04 Authentication initialization recovers after Reload", async ({ browserErrors, fixture, page }) => {
  // Given: Use this case's inputs and any shared test setup.
  browserErrors.allow(/console error: .*E2E_AUTH_BOOTSTRAP_FAILURE/u);
  browserErrors.allow(
    /console error: Failed to load resource: .*\[http:\/\/auth\.app\.test:9099\/identitytoolkit\.googleapis\.com\/v1\/accounts:signUp/iu
  );
  await fixture.apply(page, { auth: { failSignUpOnce: true } });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Unable to start Tango" })).toBeVisible();
  await expect(page.getByText(/Authentication or saved data could not be initialized\./u)).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("auth/e2e-auth-bootstrap-failure");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  // When: Exercise `page.getByRole("button", { name: "Reload", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Reload", exact: true }).click();

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
});

test("ACCOUNT-05 Pending and visible notifications follow language changes", async ({ fixture, page, namespace }) => {
  // Given: Prepare `popup` and any shared test state below.
  await page.clock.install();
  await fixture.apply(page, { auth: false });
  await page.goto("/account");
  const popup = await openGooglePopup(page);

  // When: Exercise `page.getByRole("button", { name: "Open settings" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
  // When: Exercise `completeGooglePopup` with the prepared inputs.
  await completeGooglePopup(page, namespace.uid, popup);

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("status", { name: "トースト通知" })).toHaveText("成功: ログインしました。");
  await expect(page.getByText("ログインしました。", { exact: true })).toBeVisible();
  // Pause after real authentication completes so the notification's remaining lifetime can be checked deterministically.
  // When: Exercise `page.clock.pauseAt` with the prepared inputs.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  await page.clock.runFor(2000);
  await page.getByRole("button", { name: "通知を閉じる" }).focus();
  await page.getByRole("combobox", { name: "言語" }).selectOption("en");

  const status = page.getByRole("status", { name: "Toast notifications" });
  // Then: Verify the expected result in the assertions below.
  await expect(status).toHaveText("Success: Signed in.");
  await expect(page.getByText("Signed in.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dismiss notification" })).toBeFocused();

  // When: Exercise `page.clock.runFor` with the prepared inputs.
  await page.clock.runFor(2000);
  // Then: Verify the expected result in the assertions below.
  await expect(status).toBeEmpty();
  await expect(page.getByRole("button", { name: "Dismiss notification" })).toHaveCount(0);
});
