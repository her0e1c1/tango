import type { Page } from "@playwright/test";

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

export const e2eConfig = {
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

export const seedConfig = async (page: Page, config: typeof e2eConfig = e2eConfig) => {
  await page.addInitScript((value) => {
    window.localStorage.setItem("tango-config", JSON.stringify({ state: { config: value }, version: 1 }));
  }, config);
};

export const routeAnonymousAuth = async (page: Page, uid: string, nextUid?: string) => {
  let activeUid = uid;
  let signInCount = 0;
  await page.route("https://identitytoolkit.googleapis.com/**", async (route) => {
    if (route.request().url().includes("accounts:lookup")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          kind: "identitytoolkit#GetAccountInfoResponse",
          users: [{ localId: activeUid, lastLoginAt: "1", createdAt: "1", lastRefreshAt: new Date().toISOString() }],
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
};

const firestoreValue = (value: unknown): object => {
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  throw new Error(`Unsupported Firestore fixture value: ${String(value)}`);
};

export const setDocument = async (collection: "deck" | "card", id: string, document: Record<string, unknown>) => {
  const fields = Object.fromEntries(
    Object.entries(document).flatMap(([key, value]) => (value === undefined ? [] : [[key, firestoreValue(value)]]))
  );
  const response = await fetch(`${firestoreBase}/${collection}/${id}`, {
    method: "PATCH",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(`Firestore seed failed: ${response.status} ${await response.text()}`);
};

export const getDocument = async (collection: "deck" | "card", id: string) => {
  const response = await fetch(`${firestoreBase}/${collection}/${id}`, {
    headers: { Authorization: "Bearer owner" },
  });
  if (!response.ok) throw new Error(`Firestore read failed: ${response.status} ${await response.text()}`);
  return (await response.json()) as { fields: Record<string, { integerValue?: string; stringValue?: string }> };
};

export const seedDeckAndCards = async (
  deck: Record<string, unknown> & { id: string },
  cards: Array<Record<string, unknown> & { id: string }>
) => {
  await setDocument("deck", deck.id, deck);
  await Promise.all(cards.map((card) => setDocument("card", card.id, card)));
};
