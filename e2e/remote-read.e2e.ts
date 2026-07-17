import { expect, test, type Page } from "@playwright/test";

const projectId = "tango-e2e";
const firestorePort = process.env.VITE_DB_PORT ?? "8080";
const firestoreBase = `http://db:${firestorePort}/v1/projects/${projectId}/databases/(default)/documents`;

const encodeTokenPart = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

const emulatorToken = (uid: string) => {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeTokenPart({ alg: "none", typ: "JWT" });
  const payload = encodeTokenPart({
    aud: projectId,
    auth_time: now,
    exp: now + 3600,
    firebase: { identities: {}, sign_in_provider: "anonymous" },
    iat: now,
    iss: `https://securetoken.google.com/${projectId}`,
    sub: uid,
    user_id: uid,
  });
  return `${header}.${payload}.`;
};

const field = {
  string: (value: string) => ({ stringValue: value }),
  boolean: (value: boolean) => ({ booleanValue: value }),
  integer: (value: number) => ({ integerValue: String(value) }),
  null: () => ({ nullValue: null }),
  strings: (values: string[]) => ({ arrayValue: { values: values.map((value) => ({ stringValue: value })) } }),
};

const setDocument = async (collection: "deck" | "card", id: string, fields: object) => {
  const response = await fetch(`${firestoreBase}/${collection}/${id}`, {
    method: "PATCH",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(`Firestore seed failed: ${response.status} ${await response.text()}`);
};

const getDocument = async (collection: "deck" | "card", id: string) => {
  const response = await fetch(`${firestoreBase}/${collection}/${id}`, {
    headers: { Authorization: "Bearer owner" },
  });
  if (!response.ok) throw new Error(`Firestore read failed: ${response.status} ${await response.text()}`);
  return (await response.json()) as { fields: Record<string, { stringValue?: string }> };
};

const deckCard = (page: Page, name: string) =>
  page.getByText(name, { exact: true }).locator("xpath=ancestor::div[contains(@class, 'rounded')][1]");

const cardItem = (page: Page, frontText: string) =>
  page.getByText(frontText, { exact: true }).locator("xpath=ancestor::div[contains(@class, 'rounded')][1]");

const deckFields = (uid: string, name: string) => ({
  uid: field.string(uid),
  name: field.string(name),
  isPublic: field.boolean(false),
  createdAt: field.integer(1),
  updatedAt: field.integer(2),
  deletedAt: field.null(),
  scoreMax: field.null(),
  scoreMin: field.null(),
  selectedTags: field.strings([]),
  tagAndFilter: field.boolean(false),
  category: field.string("English"),
  convertToBr: field.boolean(false),
});

const cardFields = (uid: string, deckId: string, frontText: string) => ({
  uid: field.string(uid),
  deckId: field.string(deckId),
  frontText: field.string(frontText),
  backText: field.string("Remote back"),
  tags: field.strings([]),
  uniqueKey: field.string("remote-key"),
  createdAt: field.integer(1),
  updatedAt: field.integer(2),
  deletedAt: field.null(),
  score: field.integer(0),
  numberOfSeen: field.integer(0),
});

const persistedConfig = {
  useCardInterval: false,
  showSwipeButtonList: true,
  showScoreSlider: false,
  showHeader: true,
  fullscreen: false,
  maxNumberOfCardsToLearn: 10,
  hideBodyWhenCardChanged: true,
  sizeBackText: 0,
  shuffled: false,
  defaultAutoPlay: false,
  cardInterval: 60,
  keepBackTextViewed: false,
  showSwipeFeedback: false,
  cardSwipeUp: "GoToNextCardMastered",
  cardSwipeDown: "GoToNextCardNotMastered",
  cardSwipeLeft: "GoToPrevCard",
  cardSwipeRight: "GoToNextCard",
  darkMode: false,
  selectedTags: [],
  githubAccessToken: "",
};

const seedAuth = async (page: Page, uid: string, nextUid?: string) => {
  let activeUid = uid;
  let signInCount = 0;
  await page.route("https://identitytoolkit.googleapis.com/**", async (route) => {
    if (route.request().url().includes("accounts:lookup")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          kind: "identitytoolkit#GetAccountInfoResponse",
          users: [
            {
              localId: activeUid,
              lastLoginAt: "1",
              createdAt: "1",
              lastRefreshAt: new Date().toISOString(),
            },
          ],
        }),
      });
      return;
    }
    activeUid = signInCount === 0 ? uid : (nextUid ?? uid);
    signInCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        kind: "identitytoolkit#SignupNewUserResponse",
        idToken: emulatorToken(activeUid),
        refreshToken: "e2e-refresh-token",
        expiresIn: "3600",
        localId: activeUid,
      }),
    });
  });
  await page.addInitScript(
    (config) => {
      window.localStorage.setItem(
        "tango-config",
        JSON.stringify({ state: { config }, version: 1 })
      );
    },
    persistedConfig
  );
};

test("loads UID-scoped remote Decks and Cards again after reload", async ({ page }) => {
  const uid = "remote-read-user";
  await setDocument("deck", "remote-read-deck", deckFields(uid, "Remote Query Deck"));
  await setDocument("card", "remote-read-card", cardFields(uid, "remote-read-deck", "Remote Query Card"));
  await setDocument("deck", "foreign-deck", deckFields("foreign-user", "Foreign Deck"));
  await seedAuth(page, uid);

  await page.goto("/");
  await expect(page.getByText("Remote Query Deck")).toBeVisible();
  await expect(page.getByText("Foreign Deck")).not.toBeVisible();
  await page.goto("/deck/remote-read-deck/edit");
  await page.locator("input[name='name']").fill("Updated Remote Query Deck");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Updated Remote Query Deck")).toBeVisible();
  await expect
    .poll(async () => (await getDocument("deck", "remote-read-deck")).fields.name?.stringValue)
    .toBe("Updated Remote Query Deck");

  await page.getByText("Updated Remote Query Deck").click();
  await expect(page.getByText("Remote Query Card")).toBeVisible();

  await page.goto("/card/remote-read-card/edit");
  const frontText = page.locator("textarea[name='frontText']");
  await frontText.fill("Updated Remote Query Card");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Updated Remote Query Card")).toBeVisible();
  await expect
    .poll(async () => (await getDocument("card", "remote-read-card")).fields.frontText?.stringValue)
    .toBe("Updated Remote Query Card");

  await page.reload();

  await expect(page.getByText("Updated Remote Query Card")).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await cardItem(page, "Updated Remote Query Card").locator("svg").nth(1).click();
  await expect(page.getByText("Updated Remote Query Card")).not.toBeVisible();

  await page.goto("/");
  await deckCard(page, "Updated Remote Query Deck").locator("svg").nth(2).click();
  await expect(page.getByText("Updated Remote Query Deck")).not.toBeVisible();

  const persistedEntityState = await page.evaluate(() => {
    const root = JSON.parse(window.localStorage.getItem("tango-config") ?? "{}") as {
      state?: Record<string, unknown>;
    };
    const state = root.state ?? {};
    return {
      hasDeck: "deck" in state,
      hasCard: "card" in state,
    };
  });
  expect(persistedEntityState).toEqual({ hasDeck: false, hasCard: false });
});

test("logout replaces the UID-scoped Query cache", async ({ page }) => {
  const uidA = "logout-user-a";
  const uidB = "logout-user-b";
  await setDocument("deck", "logout-deck-a", deckFields(uidA, "Logout Deck A"));
  await setDocument("deck", "logout-deck-b", deckFields(uidB, "Logout Deck B"));
  await seedAuth(page, uidA, uidB);

  await page.goto("/");
  await expect(page.getByText("Logout Deck A")).toBeVisible();
  await expect(page.getByText("Logout Deck B")).not.toBeVisible();

  await page.evaluate(async (uid) => {
    // @ts-expect-error Vite serves source modules to the browser during E2E tests.
    const actions = (await import("/src/action/event.ts")) as { logout: (confirmedUid: string) => Promise<void> };
    await actions.logout(uid);
  }, uidA);

  await expect(page.getByText("Logout Deck B")).toBeVisible();
  await expect(page.getByText("Logout Deck A")).not.toBeVisible();
});
