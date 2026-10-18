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
  const popup = await openGooglePopup(page);
  await expect(popup.getByRole("button", { name: "Add new account" })).toBeVisible();
  await popup.close();
};

test("ACCOUNT-01 Google linking retains the anonymous UID and announces the linked identity", async ({
  fixture,
  page,
  namespace,
}) => {
  const anonymousUid = await test.step("Given: An anonymous account can link to Google", async () => {
    await fixture.apply(page, { auth: false });
    await page.goto("/account");
    await expect(page.getByText("Anonymous account")).toBeVisible();
    return accountUid(page);
  });

  await test.step("When: Link Google to the anonymous account", async () => {
    await completeGooglePopup(page, namespace.uid);
  });

  await test.step("Then: Announce the linked account with the same UID", async () => {
    await expect(page.getByRole("status").filter({ hasText: "Signed in." })).toBeVisible();
    await expect(page.getByText("Signed in with Google")).toBeVisible();
    await expect(page.getByText(anonymousUid, { exact: true })).toBeVisible();
  });
});

test("ACCOUNT-02 A closed Google popup can be retried successfully", async ({ fixture, page, namespace }) => {
  await test.step("Given: A failed Google sign-in leaves sign-in available", async () => {
    await fixture.apply(page, { auth: false });
    await page.goto("/account");
    await closeGooglePopup(page);
    // Firebase polls for user-closed popups with a randomized delay of up to ten seconds.
    await expect(page.getByRole("alert")).toContainText("Unable to sign in.", { timeout: 12_000 });
    await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
  });

  await test.step("When: Retry Google sign-in successfully", async () => {
    await completeGooglePopup(page, namespace.uid);
  });

  await test.step("Then: Replace the failure with success and the linked account", async () => {
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Signed in." })).toBeVisible();
    await expect(page.getByText("Signed in with Google")).toBeVisible();
  });
});

test("ACCOUNT-03 Sign-out announces a new anonymous identity", async ({ fixture, page }) => {
  const originalUid = await test.step("Given: A linked account can sign out", async () => {
    const { uid } = fixture.user();
    await fixture.apply(page);
    await page.goto("/account");
    await expect(page.getByText("Signed in with Google")).toBeVisible();
    const originalUid = await accountUid(page);
    expect(originalUid).toBe(uid);
    return originalUid;
  });

  await test.step("When: Sign out of the Google account", async () => {
    await page.getByRole("button", { name: "Sign out" }).click();
  });

  await test.step("Then: Announce sign-out and display a different anonymous UID", async () => {
    await expect(page.getByRole("status").filter({ hasText: "Signed out." })).toBeVisible();
    await expect(page.getByText("Anonymous account")).toBeVisible();
    const nextUid = await accountUid(page);
    expect(nextUid).not.toBe(originalUid);
  });
});

test("ACCOUNT-04 Authentication initialization recovers after Reload", async ({ browserErrors, fixture, page }) => {
  await test.step("Given: Authentication initialization has failed and offers Reload", async () => {
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
  });

  await test.step("When: Reload after the failure", async () => {
    await page.getByRole("button", { name: "Reload", exact: true }).click();
  });

  await test.step("Then: Recover to one Deck list without stale authentication UI or notifications", async () => {
    await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Reload", exact: true })).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("status")).toBeEmpty();
  });
});

test("ACCOUNT-05 Pending sign-in announces success in the language at completion", async ({
  fixture,
  page,
  namespace,
}) => {
  const popup = await test.step("Given: Google sign-in is pending in English", async () => {
    await fixture.apply(page, { auth: false });
    await page.goto("/account");
    return openGooglePopup(page);
  });

  await test.step("When: Switch to Japanese before completing sign-in", async () => {
    await page.getByRole("button", { name: "Open settings" }).click();
    await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
    await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
    await completeGooglePopup(page, namespace.uid, popup);
  });

  await test.step("Then: Display and announce success in Japanese", async () => {
    await expect(page.getByRole("status", { name: "トースト通知" })).toHaveText("成功: ログインしました。");
    await expect(page.getByText("ログインしました。", { exact: true })).toBeVisible();
  });
});

test("ACCOUNT-06 Google linking preserves Decks and Cards after reload and synchronization", async ({
  fixture,
  page,
  namespace,
}) => {
  const { local, anonymousUid } =
    await test.step("Given: Decks and Cards exist only in this anonymous browser", async () => {
      await fixture.apply(page, { auth: false });
      const local = await createAnonymousDeck(page);
      await page.goto("/account");
      const anonymousUid = await accountUid(page);
      for (const collection of ["deck", "card"] as const) {
        expect(
          (await listDocuments(collection)).filter(({ fields }) => fields.uid?.stringValue === anonymousUid)
        ).toEqual([]);
      }
      return { local, anonymousUid };
    });

  await test.step("When: Link Google to the anonymous account", async () => {
    await completeGooglePopup(page, namespace.uid);
    await expect(page.getByText("Signed in with Google")).toBeVisible();
  });

  await test.step("Then: Retain the Deck and Card contents after reload and synchronize them", async () => {
    const { deck } = local;
    await page.reload();
    await page.goto("/");
    await expect(page.getByText(deck.name, { exact: true })).toBeVisible();
    await page.goto(`/deck/${deck.id}`);
    await expect(page.getByText(local.first.frontText, { exact: true })).toBeVisible();
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
  });
});

test("ACCOUNT-07 Google linking preserves the current study card and resume position", async ({
  fixture,
  page,
  namespace,
}) => {
  const { local, card, anonymousUid } =
    await test.step("Given: An anonymous study session has a known current card", async () => {
      await fixture.apply(page, { auth: false });
      const local = await createAnonymousDeck(page);
      const studyFront = await startAnonymousStudy(page, local.deck.id);
      const card = studyFront === local.first.frontText ? local.first : local.second;
      await page.goto("/account");
      await expect(page.getByText("Anonymous account")).toBeVisible();
      const anonymousUid = await accountUid(page);
      for (const collection of ["deck", "card", "studySession", "studyAnswer"] as const) {
        expect(
          (await listDocuments(collection)).filter(({ fields }) => fields.uid?.stringValue === anonymousUid)
        ).toEqual([]);
      }
      return { local, card, anonymousUid };
    });

  await test.step("When: Link Google to the anonymous account", async () => {
    await completeGooglePopup(page, namespace.uid);
    await expect(page.getByText("Signed in with Google")).toBeVisible();
  });

  await test.step("Then: Resume the same card and position after reload and synchronization", async () => {
    const { deck } = local;
    await page.reload();
    await page.goto("/");
    await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("0");
    await page.goto(`/deck/${deck.id}/study`);
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
});

test("ACCOUNT-14 Sign-out isolates the previous account's Decks, Cards, and study session", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  const card = fixture.card("card-2");
  await test.step("Given: The linked account can view its Cards and continue studying", async () => {
    await fixture.apply(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
    await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
    await expect(page.getByText(card.frontText, { exact: true })).toBeVisible();
    await page.goto("/account");
    await expect(page.getByText("Signed in with Google")).toBeVisible();
    expect(await accountUid(page)).toBe(fixture.user().uid);
  });

  await test.step("When: Sign out into a new anonymous account", async () => {
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByText("Anonymous account")).toBeVisible();
  });

  await test.step("Then: Deny access to the previous account's data, including after reload", async () => {
    await page.goto("/");
    await expect(page.getByText(deck.name, { exact: true })).toHaveCount(0);
    await page.goto(`/deck/${deck.id}`);
    await expect(page.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    await expect(page.getByText(card.frontText, { exact: true })).toHaveCount(0);
    await page.goto(`/deck/${deck.id}/study`);
    await expect(page.getByRole("heading", { level: 1, name: "Study session unavailable." })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Study session unavailable." })).toBeVisible();
  });
});

test("ACCOUNT-19 Visible notifications retain focus and their deadline when the language changes", async ({
  fixture,
  page,
  namespace,
}) => {
  await test.step("Given: A Japanese success notification has focus before its deadline", async () => {
    await page.clock.install();
    await fixture.apply(page, { auth: false });
    await page.goto("/account");
    const popup = await openGooglePopup(page);
    await page.getByRole("button", { name: "Open settings" }).click();
    await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
    await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
    await completeGooglePopup(page, namespace.uid, popup);
    await expect(page.getByRole("status", { name: "トースト通知" })).toHaveText("成功: ログインしました。");
    await expect(page.getByText("ログインしました。", { exact: true })).toBeVisible();
    // Pause after real authentication completes so the notification's remaining lifetime can be checked deterministically.
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
    await page.clock.runFor(2000);
    await page.getByRole("button", { name: "通知を閉じる" }).focus();
  });

  await test.step("When: Change the language of the visible notification to English", async () => {
    await page.getByRole("combobox", { name: "言語" }).selectOption("en");
  });

  await test.step("Then: Update its accessible text without duplicating it or resetting focus and expiry", async () => {
    const status = page.getByRole("status", { name: "Toast notifications" });
    await expect(status).toHaveText("Success: Signed in.");
    await expect(page.getByText("Signed in.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dismiss notification" })).toBeFocused();
    await page.clock.runFor(2000);
    await expect(status).toBeEmpty();
    await expect(page.getByRole("button", { name: "Dismiss notification" })).toHaveCount(0);
  });
});
