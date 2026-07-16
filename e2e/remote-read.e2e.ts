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

const persistedConfig = (uid: string) => ({
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
  uid,
  isAnonymous: true,
  displayName: null,
  selectedTags: [],
  lastUpdatedAt: 0,
  githubAccessToken: "",
  loadSample: false,
  localMode: false,
});

const seedAuth = async (page: Page, uid: string, staleDeck?: object) => {
  await page.route("https://identitytoolkit.googleapis.com/**", async (route) => {
    if (route.request().url().includes("accounts:lookup")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          kind: "identitytoolkit#GetAccountInfoResponse",
          users: [
            {
              localId: uid,
              lastLoginAt: "1",
              createdAt: "1",
              lastRefreshAt: new Date().toISOString(),
            },
          ],
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        kind: "identitytoolkit#SignupNewUserResponse",
        idToken: emulatorToken(uid),
        refreshToken: "e2e-refresh-token",
        expiresIn: "3600",
        localId: uid,
      }),
    });
  });
  await page.addInitScript(
    ({ config, deck }) => {
      window.localStorage.setItem(
        "persist:root",
        JSON.stringify({
          config: JSON.stringify(config),
          ...(deck == null ? {} : { deck: JSON.stringify({ byId: { stale: deck }, categories: [] }) }),
          _persist: JSON.stringify({ version: 2, rehydrated: true }),
        })
      );
    },
    { config: persistedConfig(uid), deck: staleDeck }
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
  await page.getByText("Remote Query Deck").click();
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
});

test("an empty initial snapshot removes a stale Redux remote mirror", async ({ page }) => {
  const uid = "empty-remote-read-user";
  const staleDeck = {
    id: "stale",
    uid,
    name: "Stale Remote Deck",
    isPublic: false,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    localMode: false,
    scoreMax: null,
    scoreMin: null,
    selectedTags: [],
    tagAndFilter: false,
    category: "",
    convertToBr: false,
  };
  await seedAuth(page, uid, staleDeck);

  await page.goto("/");

  await expect(page.getByText("Stale Remote Deck")).not.toBeVisible();
  await expect(page.getByRole("status")).toHaveText("No decks yet.");
});
