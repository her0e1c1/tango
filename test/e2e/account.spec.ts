import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const signOutFailureKey = "tango-e2e-fail-sign-out-once";
const signOutFailureReleaseEvent = "tango-e2e-release-sign-out-failure";

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

const waitForGoogleFailure = (page: Page) =>
  // Firebase detects a closed desktop popup after its polling and auth-event grace periods.
  expect(page.getByRole("alert")).toContainText("Unable to sign in.", { timeout: 12_000 });

const closeGooglePopup = async (page: Page, buttonName: "Retry" | "Sign in with Google") => {
  const popup = await openGooglePopup(page, buttonName);
  await popup.close();
  await waitForGoogleFailure(page);
};

const completeOpenGooglePopup = async (popup: Page, namespace: string) => {
  await popup.getByRole("button", { name: "Add new account" }).click();
  await popup.locator("#email-input").fill(`${namespace}@example.test`);
  await popup.locator("#display-name-input").fill(`E2E ${namespace}`);
  await Promise.all([
    popup.waitForEvent("close"),
    popup.getByRole("button", { name: /Sign in with Google\.com/ }).click(),
  ]);
};

const completeGooglePopup = async (
  page: Page,
  namespace: string,
  buttonName: "Retry" | "Sign in with Google" = "Sign in with Google"
) => {
  const popup = await openGooglePopup(page, buttonName);
  await completeOpenGooglePopup(popup, namespace);
};

const armSignOutFailure = (page: Page) =>
  page.evaluate((failureKey) => window.sessionStorage.setItem(failureKey, "armed"), signOutFailureKey);

const waitForSignOutFailureRelease = (page: Page) =>
  expect
    .poll(() => page.evaluate((failureKey) => window.sessionStorage.getItem(failureKey), signOutFailureKey), {
      message: "sign-out failure hook was not reached",
      timeout: 5000,
    })
    .toBe("consumed");

const releaseSignOutFailure = (page: Page) =>
  page.evaluate((eventName) => window.dispatchEvent(new Event(eventName)), signOutFailureReleaseEvent);

const failSignOut = async (page: Page, buttonName: "Retry" | "Sign out") => {
  await armSignOutFailure(page);
  await page.getByRole("button", { name: buttonName, exact: true }).click();
  await waitForSignOutFailureRelease(page);
  await releaseSignOutFailure(page);
  await expect(page.getByRole("alert")).toContainText("Unable to sign out.");
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
  await expect(page.getByRole("status").filter({ hasText: "Signed in." })).toBeVisible();
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

  const popup = await openGooglePopup(page, "Sign in with Google");
  await page.bringToFront();
  await page.keyboard.press("t");
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  await popup.close();
  await waitForGoogleFailure(page);
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();

  await completeGooglePopup(page, namespace.uid, "Retry");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Signed in." })).toBeVisible();
  await page.goto("/account");
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
  await expect(page.getByRole("status").filter({ hasText: "Signed out." })).toBeVisible();
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

test("ACCOUNT-05 A late sign-out failure can be retried after leaving Account", async ({ fixture, page }) => {
  await fixture.apply(page);
  await page.goto("/account");
  await expect(page.getByText("Signed in with Google")).toBeVisible();
  const originalUid = await accountUid(page);

  await armSignOutFailure(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await waitForSignOutFailureRelease(page);
  await page.keyboard.press("t");
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  await releaseSignOutFailure(page);
  await expect(page.getByRole("alert")).toContainText("Unable to sign out.");
  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Signed out." })).toBeVisible();
  await page.goto("/account");
  await expect(page.getByText("Anonymous account")).toBeVisible();
  expect(await accountUid(page)).not.toBe(originalUid);
});

test("ACCOUNT-06 Mounted sign-in reruns prevent duplicate actions", async ({ fixture, page, namespace }) => {
  test.slow();
  await fixture.apply(page, { auth: false });
  await page.goto("/account");
  await closeGooglePopup(page, "Sign in with Google");

  await page.keyboard.press("t");
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await page.getByRole("button", { name: "Open account" }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to sign in.");

  const normalRerunPopup = await openGooglePopup(page, "Sign in with Google");
  const signInButton = page.getByRole("button", { name: "Sign in with Google", exact: true });
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(signInButton).toBeDisabled();
  await expect(signInButton).toHaveAttribute("aria-busy", "true");
  await normalRerunPopup.close();
  await waitForGoogleFailure(page);

  const retryPopup = await openGooglePopup(page, "Retry");
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(signInButton).toBeDisabled();
  await expect(signInButton).toHaveAttribute("aria-busy", "true");
  await completeOpenGooglePopup(retryPopup, namespace.uid);

  await expect(page.getByRole("status").filter({ hasText: "Signed in." })).toBeVisible();
});

test("ACCOUNT-07 A mounted sign-out Retry prevents another action", async ({ fixture, page }) => {
  await fixture.apply(page);
  await page.goto("/account");
  await failSignOut(page, "Sign out");

  await page.keyboard.press("t");
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await page.getByRole("button", { name: "Open account" }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to sign out.");

  await armSignOutFailure(page);
  await page.getByRole("button", { name: "Retry" }).click();
  await waitForSignOutFailureRelease(page);
  const signOutButton = page.getByRole("button", { name: "Sign out", exact: true });
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(signOutButton).toBeDisabled();
  await expect(signOutButton).toHaveAttribute("aria-busy", "true");
  await releaseSignOutFailure(page);
  await expect(page.getByRole("alert")).toContainText("Unable to sign out.");

  await signOutButton.click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Signed out." })).toBeVisible();
});

test("ACCOUNT-08 A visible sign-in failure survives route replacement", async ({ fixture, page, namespace }) => {
  await fixture.apply(page, { auth: false });
  await page.goto("/account");
  await closeGooglePopup(page, "Sign in with Google");

  await page.keyboard.press("t");
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Unable to sign in.");
  await completeGooglePopup(page, namespace.uid, "Retry");

  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Signed in." })).toBeVisible();
});

test("ACCOUNT-09 A visible sign-out failure survives route replacement", async ({ fixture, page }) => {
  await fixture.apply(page);
  await page.goto("/account");
  await failSignOut(page, "Sign out");

  await page.keyboard.press("t");
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Unable to sign out.");
  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Signed out." })).toBeVisible();
});

test("ACCOUNT-10 A replacement sign-in failure provides a fresh Retry", async ({ fixture, page, namespace }) => {
  test.slow();
  await fixture.apply(page, { auth: false });
  await page.goto("/account");
  await closeGooglePopup(page, "Sign in with Google");

  const retryPopup = await openGooglePopup(page, "Retry");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await retryPopup.close();
  await waitForGoogleFailure(page);
  await expect(page.getByRole("alert")).toHaveCount(1);
  await completeGooglePopup(page, namespace.uid, "Retry");

  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Signed in." })).toBeVisible();
});

test("ACCOUNT-11 A replacement sign-out failure provides a fresh Retry", async ({ fixture, page }) => {
  await fixture.apply(page);
  await page.goto("/account");
  await failSignOut(page, "Sign out");

  await failSignOut(page, "Retry");
  await expect(page.getByRole("alert")).toHaveCount(1);
  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Signed out." })).toBeVisible();
});
