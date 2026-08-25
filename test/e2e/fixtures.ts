import { createHash, randomUUID } from "node:crypto";
import {
  expect as playwrightExpect,
  test as playwrightTest,
  type BrowserContext,
  type Page,
  type Request,
  type Route,
} from "@playwright/test";

const projectId = "tango-e2e";
const firestorePort = process.env.VITE_DB_PORT ?? "8080";
const firestoreBase = `http://db:${firestorePort}/v1/projects/${projectId}/databases/(default)/documents`;

export type FirestoreCollection = "deck" | "card";

export interface TestNamespace {
  caseId: string;
  uid: string;
  id: (label: string) => string;
}

export interface BrowserErrorCollector {
  allow: (pattern: RegExp) => void;
  errors: () => readonly string[];
}

export const expectedFirestoreWriteBrowserError =
  /^console error: Failed to load resource: the server responded with a status of 403(?: \([^\]]*\))? \[http:\/\/(?:db|127\.0\.0\.1|localhost):[0-9]+\/google\.firestore\.v1\.Firestore\/Write\/channel(?:\?[^\]]*)?:[0-9]+:[0-9]+\]$/iu;

interface E2EFixtures {
  namespace: TestNamespace;
  browserErrors: BrowserErrorCollector;
}

const applicationHosts = (baseURL: string | undefined) => {
  const hosts = new Set(["app.test", "127.0.0.1", "localhost"]);
  if (baseURL !== undefined) hosts.add(new URL(baseURL).hostname);
  return hosts;
};

export const collectBrowserErrors = (context: BrowserContext, baseURL?: string) => {
  const hosts = applicationHosts(baseURL);
  const observed: string[] = [];
  const allowed: RegExp[] = [];
  const isApplicationPage = (page: Page) => {
    try {
      return hosts.has(new URL(page.url()).hostname);
    } catch {
      return false;
    }
  };
  const attach = (page: Page) => {
    page.on("console", (message) => {
      if (message.type() !== "error" || !isApplicationPage(page)) return;
      const location = message.location();
      const locationUrl = location.url === "" ? page.url() : location.url;
      observed.push(
        `console error: ${message.text()} [${locationUrl}:${String(location.lineNumber)}:${String(location.columnNumber)}]`
      );
    });
    page.on("pageerror", (error) => {
      if (isApplicationPage(page)) observed.push(`page error: ${error.message} [${page.url()}]`);
    });
  };

  for (const page of context.pages()) attach(page);
  context.on("page", attach);

  return {
    collector: {
      allow: (pattern: RegExp) => allowed.push(pattern),
      errors: () => observed,
    } satisfies BrowserErrorCollector,
    assert: () => {
      const unexpected = observed.filter((error) => !allowed.some((pattern) => pattern.test(error)));
      playwrightExpect(unexpected).toEqual([]);
    },
  };
};

const createNamespace = (title: string, testId: string, retry: number): TestNamespace => {
  const caseId = /^([A-Z]+-[0-9]{2})\b/.exec(title)?.[1];
  if (caseId === undefined) throw new Error(`E2E test title must start with a documented case ID: ${title}`);
  const digest = createHash("sha256").update(`${testId}:${retry}`).digest("hex").slice(0, 10);
  const stem = `${caseId.toLowerCase()}-${digest}`;
  return {
    caseId,
    uid: `${stem}-user`,
    id: (label) => `${stem}-${label.replaceAll(/[^a-zA-Z0-9-]/g, "-").toLowerCase()}`,
  };
};

export const test = playwrightTest.extend<E2EFixtures>({
  namespace: async ({ browserName }, use, testInfo) => {
    await use(
      createNamespace(
        testInfo.title,
        `${testInfo.testId}:${browserName}:${String(testInfo.repeatEachIndex)}`,
        testInfo.retry
      )
    );
  },
  browserErrors: [
    async ({ baseURL, context }, use) => {
      const errors = collectBrowserErrors(context, baseURL);
      await use(errors.collector);
      errors.assert();
    },
    { auto: true },
  ],
});

export const expect = playwrightExpect;

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

export interface AnonymousAuthOptions {
  linked?: boolean;
  nextUid?: string;
  failSignUpOnce?: boolean;
}

export const routeAnonymousAuth = async (page: Page, uid: string, options: AnonymousAuthOptions | string = {}) => {
  const normalizedOptions = typeof options === "string" ? { nextUid: options } : options;
  let activeUid = uid;
  let signInCount = 0;
  let shouldFailSignUp = normalizedOptions.failSignUpOnce ?? false;
  await page.route("**/identitytoolkit.googleapis.com/**", async (route) => {
    const url = route.request().url();
    if (url.includes("accounts:lookup")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          kind: "identitytoolkit#GetAccountInfoResponse",
          users: [
            {
              localId: activeUid,
              ...(normalizedOptions.linked
                ? {
                    providerUserInfo: [{ providerId: "google.com", rawId: activeUid, displayName: "E2E User" }],
                  }
                : {}),
              lastLoginAt: "1",
              createdAt: "1",
              lastRefreshAt: new Date().toISOString(),
            },
          ],
        }),
      });
      return;
    }
    if (url.includes("accounts:signUp") && shouldFailSignUp) {
      shouldFailSignUp = false;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: 500, message: "E2E_AUTH_BOOTSTRAP_FAILURE" } }),
      });
      return;
    }
    if (url.includes("accounts:signUp")) {
      activeUid = signInCount === 0 ? uid : (normalizedOptions.nextUid ?? uid);
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
      return;
    }
    await route.fallback();
  });
};

export const e2eConfig = {
  loadSample: false,
  appearance: {
    darkMode: false,
    showHeader: true,
    fullscreen: false,
    sizeBackText: 0,
    hideBodyWhenCardChanged: true,
    showSwipeFeedback: false,
  },
  study: {
    maxNumberOfCardsToLearn: 10,
    shuffled: false,
    useCardInterval: false,
    cardInterval: 60,
    keepBackTextViewed: false,
    defaultAutoPlay: false,
    selectedTags: [] as string[],
  },
  controls: {
    showSwipeButtonList: true,
    showScoreSlider: false,
    cardSwipeUp: "GoToNextCardMastered",
    cardSwipeDown: "GoToNextCardNotMastered",
    cardSwipeLeft: "GoToPrevCard",
    cardSwipeRight: "GoToNextCard",
  },
};

export type E2EConfig = typeof e2eConfig;
export type E2EConfigOverrides = Partial<Omit<E2EConfig, "appearance" | "study" | "controls">> & {
  appearance?: Partial<E2EConfig["appearance"]>;
  study?: Partial<E2EConfig["study"]>;
  controls?: Partial<E2EConfig["controls"]>;
};

export const createE2EConfig = (overrides: E2EConfigOverrides = {}): E2EConfig => ({
  ...e2eConfig,
  ...overrides,
  appearance: { ...e2eConfig.appearance, ...overrides.appearance },
  study: { ...e2eConfig.study, ...overrides.study },
  controls: { ...e2eConfig.controls, ...overrides.controls },
});

export const seedConfig = async (page: Page, overrides: E2EConfigOverrides = {}) => {
  const config = createE2EConfig(overrides);
  await page.addInitScript((value) => {
    // Seed only the first app document so reload assertions observe mutations made by the application.
    if (!window.location.origin.startsWith("http")) return;
    if (window.sessionStorage.getItem("tango-e2e-config-seeded") !== null) return;
    window.localStorage.setItem("tango-config", JSON.stringify({ state: { preferences: value }, version: 0 }));
    window.sessionStorage.setItem("tango-e2e-config-seeded", "true");
  }, config);
};

export interface StudySessionFixture {
  sessionId: string;
  deckId: string;
  cardOrderIds: string[];
  currentIndex: number;
  lastStudiedAt: number;
}

export interface LocalDataFixture {
  decks?: Record<string, unknown>[];
  cards?: Record<string, unknown>[];
  sessionsByDeckId?: Record<string, StudySessionFixture>;
}

export const seedLocalData = async (page: Page, fixture: LocalDataFixture) => {
  await page.addInitScript((value) => {
    // Keep the fixture stable for initial hydration without resurrecting data after navigation or reload.
    if (!window.location.origin.startsWith("http")) return;
    if (window.sessionStorage.getItem("tango-e2e-local-data-seeded") !== null) return;
    window.localStorage.setItem(
      "tango-local-decks",
      JSON.stringify({ state: { localDecks: value.decks ?? [] }, version: 1 })
    );
    window.localStorage.setItem(
      "tango-local-cards",
      JSON.stringify({ state: { localCards: value.cards ?? [] }, version: 1 })
    );
    window.localStorage.setItem(
      "tango-study",
      JSON.stringify({ state: { sessionsByDeckId: value.sessionsByDeckId ?? {} }, version: 4 })
    );
    window.sessionStorage.setItem("tango-e2e-local-data-seeded", "true");
  }, fixture);
};

export const seedStudySessions = async (page: Page, sessionsByDeckId: Record<string, StudySessionFixture>) => {
  if (page.url() === "about:blank") {
    await page.goto("/");
    await page.getByRole("heading", { level: 1, name: "Decks" }).waitFor();
  }
  await page.evaluate((sessions) => {
    window.localStorage.setItem("tango-study", JSON.stringify({ state: { sessionsByDeckId: sessions }, version: 4 }));
  }, sessionsByDeckId);
  // Initial anonymous bootstrap clears study state at the identity boundary, so hydrate only after auth has settled.
  await page.reload();
};

export const readLocalData = async (page: Page) =>
  page.evaluate(() => ({
    decks: JSON.parse(window.localStorage.getItem("tango-local-decks") ?? "{}").state?.localDecks ?? [],
    cards: JSON.parse(window.localStorage.getItem("tango-local-cards") ?? "{}").state?.localCards ?? [],
    sessionsByDeckId: JSON.parse(window.localStorage.getItem("tango-study") ?? "{}").state?.sessionsByDeckId ?? {},
  }));

export const createRemoteDeckFixture = (namespace: TestNamespace, overrides: Record<string, unknown> = {}) => ({
  id: namespace.id("deck"),
  name: `${namespace.caseId} Deck`,
  category: "English",
  uid: namespace.uid,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  scoreMax: null,
  scoreMin: null,
  isPublic: false,
  selectedTags: [] as string[],
  tagAndFilter: false,
  convertToBr: false,
  ...overrides,
});

export const createRemoteCardFixture = (
  namespace: TestNamespace,
  deckId: string,
  overrides: Record<string, unknown> = {}
) => ({
  id: namespace.id("card"),
  deckId,
  uid: namespace.uid,
  frontText: `${namespace.caseId} front`,
  backText: `${namespace.caseId} back`,
  tags: [] as string[],
  uniqueKey: namespace.id("key"),
  score: 0,
  numberOfSeen: 0,
  interval: 0,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  ...overrides,
});

export const createLocalDeckFixture = (namespace: TestNamespace, overrides: Record<string, unknown> = {}) => ({
  ...createRemoteDeckFixture(namespace, overrides),
  uid: undefined,
  localMode: true,
});

export const createLocalCardFixture = (
  namespace: TestNamespace,
  deckId: string,
  overrides: Record<string, unknown> = {}
) => ({
  ...createRemoteCardFixture(namespace, deckId, overrides),
  uid: undefined,
});

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

export interface FirestoreDocument {
  name: string;
  fields: Partial<
    Record<
      string,
      {
        arrayValue?: { values?: Record<string, unknown>[] };
        booleanValue?: boolean;
        doubleValue?: number;
        integerValue?: string;
        nullValue?: null;
        stringValue?: string;
      }
    >
  >;
}

export const setDocument = async (collection: FirestoreCollection, id: string, document: Record<string, unknown>) => {
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

export const getDocument = async (
  collection: FirestoreCollection,
  id: string
): Promise<FirestoreDocument | undefined> => {
  const response = await fetch(`${firestoreBase}/${collection}/${id}`, {
    headers: { Authorization: "Bearer owner" },
  });
  if (response.status === 404) return;
  if (!response.ok) throw new Error(`Firestore read failed: ${response.status} ${await response.text()}`);
  return (await response.json()) as FirestoreDocument;
};

export const requireDocument = async (collection: FirestoreCollection, id: string) => {
  const document = await getDocument(collection, id);
  if (document === undefined) throw new Error(`Firestore document is missing: ${collection}/${id}`);
  return document;
};

export const listDocuments = async (collection: FirestoreCollection): Promise<FirestoreDocument[]> => {
  const response = await fetch(`${firestoreBase}/${collection}?pageSize=1000`, {
    headers: { Authorization: "Bearer owner" },
  });
  if (!response.ok) throw new Error(`Firestore list failed: ${response.status} ${await response.text()}`);
  const body = (await response.json()) as { documents?: FirestoreDocument[] };
  return body.documents ?? [];
};

export const documentId = (document: FirestoreDocument) => document.name.split("/").at(-1) ?? "";

export const seedDeckAndCards = async (
  deck: Record<string, unknown> & { id: string },
  cards: (Record<string, unknown> & { id: string })[]
) => {
  await setDocument("deck", deck.id, deck);
  await Promise.all(cards.map((card) => setDocument("card", card.id, card)));
};

export interface FirestoreFault {
  dispose: () => Promise<void>;
  waitForFailure: () => Promise<void>;
  wasTriggered: () => boolean;
}

const seedDeniedWriteTarget = async (collection: FirestoreCollection, id: string) => {
  const uid = `e2e-denied-${randomUUID()}`;
  if (collection === "deck") {
    await setDocument("deck", id, { id, uid, name: "Denied E2E Deck" });
    return;
  }

  const deckId = `${id}-deck`;
  await setDocument("deck", deckId, { id: deckId, uid, name: "Denied E2E Deck" });
  await setDocument("card", id, { id, uid, deckId, frontText: "Denied E2E Card" });
};

export const failNextFirestoreWrite = async (
  page: Page,
  target: { collection: FirestoreCollection; id?: string }
): Promise<FirestoreFault> => {
  const pattern = "**/google.firestore.v1.Firestore/Write/channel**";
  const deniedId = `e2e-denied-${randomUUID()}`;
  await seedDeniedWriteTarget(target.collection, deniedId);
  let triggered = false;
  let resolveFailure: () => void;
  let rejectFailure: (error: unknown) => void;
  const failure = new Promise<void>((resolve, reject) => {
    resolveFailure = resolve;
    rejectFailure = reject;
  });
  const requestListener = (request: Request) => {
    if (!triggered) return;
    const url = new URL(request.url());
    const requestBody = request.postData() ?? "";
    if (
      request.method() !== "POST" ||
      !url.pathname.includes("google.firestore.v1.Firestore/Write/channel") ||
      url.searchParams.get("TYPE") !== "terminate" ||
      !url.searchParams.has("SID") ||
      url.searchParams.has("AID") ||
      requestBody.includes("writes")
    ) {
      return;
    }
    page.off("request", requestListener);
    void page
      .evaluate(() => undefined)
      .then(resolveFailure)
      .catch(rejectFailure);
  };
  // A terminate request is emitted only after the SDK processes the permanent stream error. Its request event is a
  // stable completion barrier because the WebChannel response carrying that error can reuse an existing long poll.
  page.on("request", requestListener);
  const handler = async (route: Route) => {
    const body = route.request().postData() ?? "";
    const decodedBody = decodeURIComponent(body.replaceAll("+", "%20"));
    const collectionPath = `/documents/${target.collection}/`;
    let requestedId = target.id;
    if (requestedId === undefined) {
      const pathIndex = decodedBody.indexOf(collectionPath);
      if (pathIndex !== -1) {
        const remainder = decodedBody.slice(pathIndex + collectionPath.length);
        const idEnd = remainder.search(/[/"}]/);
        requestedId = idEnd === -1 ? remainder : remainder.slice(0, idEnd);
      }
    }
    if (triggered || requestedId === undefined || !decodedBody.includes(`${collectionPath}${requestedId}`)) {
      await route.fallback();
      return;
    }
    triggered = true;
    // Redirecting the mutation to a foreign-owned document makes the emulator emit a protocol-level,
    // non-retryable permission error while leaving the application's intended document untouched.
    const rewrittenBody = body.replaceAll(requestedId, deniedId);
    await route.continue({ postData: rewrittenBody });
  };
  await page.route(pattern, handler);
  return {
    dispose: async () => {
      page.off("request", requestListener);
      await page.unroute(pattern, handler);
    },
    waitForFailure: () => failure,
    wasTriggered: () => triggered,
  };
};
