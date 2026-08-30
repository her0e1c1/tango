import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const accountUid = async (page: Page) => {
  const value = await page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd").textContent();
  if (value == null || value.trim() === "") throw new Error("Account User ID is unavailable");
  return value.trim();
};

const openGooglePopup = async (page: Page, buttonName: "Retry" | "Sign in with Google") => {
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
    page.getByRole("button", { name: buttonName, exact: true }).click(),
  ]);
  await popup.waitForFunction(() => typeof Reflect.get(window, "validateForm") === "function");
  return popup;
};

const completeGooglePopup = async (
  page: Page,
  namespace: string,
  buttonName: "Retry" | "Sign in with Google" = "Sign in with Google"
) => {
  const popup = await openGooglePopup(page, buttonName);
  await popup.getByRole("button", { name: "Add new account" }).click();
  await popup.locator("#email-input").fill(`${namespace}@example.test`);
  await popup.locator("#display-name-input").fill(`E2E ${namespace}`);
  await Promise.all([
    popup.waitForEvent("close"),
    popup.getByRole("button", { name: /Sign in with Google\.com/ }).click(),
  ]);
};

const closeGooglePopup = async (page: Page) => {
  const popup = await openGooglePopup(page, "Sign in with Google");
  await expect(popup.getByRole("button", { name: "Add new account" })).toBeVisible();
  await popup.close();
};

test("ACCOUNT-01 Google linking preserves the anonymous identity and its data", async ({
  fixture,
  page,
  namespace,
}) => {
  await fixture.seedPage(page, { auth: false, studySessions: false });
  await page.goto("/account");
  await expect(page.getByText("Anonymous account")).toBeVisible();
  const anonymousUid = await accountUid(page);
  const runtimeFixture = fixture.remapUsers({ "user-1": anonymousUid });
  const deck = runtimeFixture.deck();
  const card = runtimeFixture.card("card-2");
  await runtimeFixture.seedRemote();
  await runtimeFixture.seedPage(page, { auth: false, preferences: false, localData: false });
  await page.goto("/account");

  await completeGooglePopup(page, namespace.uid);
  await expect(page.getByText("Signed in with Google")).toBeVisible();
  await expect(page.getByText(anonymousUid, { exact: true })).toBeVisible();

  // The persisted session was added after the store's initial hydration; reload only after linking so it is restored.
  await page.reload();
  await page.goto("/");
  await expect(page.getByText(deck.name, { exact: true })).toBeVisible();
  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByText(card.frontText, { exact: true })).toBeVisible();
  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByText(card.frontText, { exact: true })).toBeVisible();
});

test("ACCOUNT-02 A closed Google popup can be retried successfully", async ({ fixture, page, namespace }) => {
  await fixture.apply(page, { auth: false });
  await page.goto("/account");

  await closeGooglePopup(page);
  // Firebase polls for user-closed popups with a randomized delay of up to ten seconds.
  await expect(page.getByText("Unable to sign in.")).toBeVisible({ timeout: 12_000 });
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();

  await completeGooglePopup(page, namespace.uid, "Retry");
  await expect(page.getByText("Unable to sign in.")).toHaveCount(0);
  await expect(page.getByText("Signed in with Google")).toBeVisible();
});

test("ACCOUNT-03 Sign-out switches to a new anonymous identity boundary", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card("card-2");
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/account");
  await expect(page.getByText("Signed in with Google")).toBeVisible();
  const originalUid = await accountUid(page);
  expect(originalUid).toBe(uid);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByText("Anonymous account")).toBeVisible();
  const nextUid = await accountUid(page);
  expect(nextUid).not.toBe(originalUid);

  await page.goto("/");
  await expect(page.getByText(deck.name, { exact: true })).toHaveCount(0);
  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  await expect(page.getByText(card.frontText, { exact: true })).toHaveCount(0);
  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByRole("heading", { level: 1, name: "Study session unavailable." })).toBeVisible();
  const sessions = await page.evaluate(
    () => JSON.parse(localStorage.getItem("tango-study") ?? "{}").state?.sessionsByDeckId ?? {}
  );
  expect(sessions).not.toHaveProperty(deck.id);
});

test("ACCOUNT-04 Authentication initialization recovers after Reload", async ({ browserErrors, fixture, page }) => {
  browserErrors.allow(/console error: .*E2E_AUTH_BOOTSTRAP_FAILURE/u);
  browserErrors.allow(
    /console error: Failed to load resource: .*\[http:\/\/auth\.app\.test:9099\/identitytoolkit\.googleapis\.com\/v1\/accounts:signUp/iu
  );
  await fixture.apply(page, { auth: { failSignUpOnce: true } });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Unable to start Tango" })).toBeVisible();
  await expect(page.getByText("Authentication could not be initialized.")).toBeVisible();
  await page.getByRole("button", { name: "Reload" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
});
