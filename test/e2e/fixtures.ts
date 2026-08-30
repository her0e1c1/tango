import { createHash, randomUUID } from "node:crypto";
import {
  expect as playwrightExpect,
  test as playwrightTest,
  type BrowserContext,
  type Page,
  type Request,
  type Route,
} from "@playwright/test";

import {
  type FixtureCard,
  type FixtureCategory,
  type FixtureDeck,
  type FixturePreferences,
  type FixtureSource,
  type FixtureState,
  type FixtureStudySession,
  type FixtureUser,
  loadFixtureSource,
  namespaceFixture,
  normalizeFixtureIdSegment,
  requireE2ECaseId,
} from "./yaml-fixture";

export type {
  FixtureCard,
  FixtureCategory,
  FixtureDeck,
  FixturePreferences,
  FixtureState,
  FixtureStudySession,
  FixtureUser,
} from "./yaml-fixture";

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

const expectedFirestoreWritePermissionBrowserError =
  /^console error: Failed to load resource: the server responded with a status of 403(?: \([^\]]*\))? \[http:\/\/(?:db|127\.0\.0\.1|localhost):[0-9]+\/google\.firestore\.v1\.Firestore\/Write\/channel(?:\?[^\]]*)?:[0-9]+:[0-9]+\]$/iu;

const expectedFirestoreWriteTerminationBrowserError =
  /^console error: Failed to load resource: the server responded with a status of 400(?: \([^\]]*\))? \[http:\/\/(?:db|127\.0\.0\.1|localhost):[0-9]+\/google\.firestore\.v1\.Firestore\/Write\/channel\?(?=[^\]]*SID=)(?![^\]]*AID=)(?=[^\]]*TYPE=terminate(?:&|:))[^\]]*:[0-9]+:[0-9]+\]$/iu;

export const allowExpectedFirestoreWriteFailure = (collector: BrowserErrorCollector) => {
  collector.allow(expectedFirestoreWritePermissionBrowserError);
  // The injected 403 can invalidate the stream ID before the SDK's best-effort terminate request reaches the emulator.
  collector.allow(expectedFirestoreWriteTerminationBrowserError);
};

interface E2EFixtures {
  namespace: TestNamespace;
  fixture: E2EFixture;
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
  const caseId = requireE2ECaseId(title);
  const digest = createHash("sha256").update(`${testId}:${retry}`).digest("hex").slice(0, 10);
  const stem = `${caseId.toLowerCase()}-${digest}`;
  return {
    caseId,
    uid: `${stem}-user`,
    id: (label) => `${stem}-${normalizeFixtureIdSegment(label)}`,
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
  fixture: async ({ namespace }, use) => {
    await use(createE2EFixture(loadFixtureSource(namespace.caseId), namespace));
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
              ...(normalizedOptions.linked && activeUid === uid
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

export type E2EConfig = FixturePreferences;

export const e2eConfig: E2EConfig = {
  language: "en",
  loadSample: false,
  appearance: {
    darkMode: false,
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
    showPlaybackControls: true,
    showCardDetails: true,
    showScoreSlider: false,
    showBackTextSwipeOverlays: false,
    cardSwipeUp: "GoToNextCardMastered",
    cardSwipeDown: "GoToNextCardNotMastered",
    cardSwipeLeft: "GoToPrevCard",
    cardSwipeRight: "GoToNextCard",
  },
};

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
    window.localStorage.setItem("tango-config", JSON.stringify({ state: { preferences: value }, version: 1 }));
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

export const seedStudySessions = async (
  page: Page,
  sessionsByDeckId: Record<string, StudySessionFixture>,
  deckNames: readonly string[] = []
) => {
  // Loading the Deck list first settles Auth and warms Firestore's local cache before a study route consumes both.
  await page.goto("/");
  await page.getByRole("heading", { level: 1, name: "Decks" }).waitFor();
  await Promise.all(deckNames.map((name) => page.getByRole("button", { name: `View ${name}`, exact: true }).waitFor()));
  await page.evaluate((sessions) => {
    window.localStorage.setItem("tango-study", JSON.stringify({ state: { sessionsByDeckId: sessions }, version: 4 }));
  }, sessionsByDeckId);
  // Initial anonymous bootstrap clears study state at the identity boundary, so hydrate only after auth has settled.
  await page.reload();
  await Promise.all(deckNames.map((name) => page.getByRole("button", { name: `View ${name}`, exact: true }).waitFor()));
};

export const readLocalData = async (page: Page) =>
  page.evaluate(() => ({
    decks: JSON.parse(window.localStorage.getItem("tango-local-decks") ?? "{}").state?.localDecks ?? [],
    cards: JSON.parse(window.localStorage.getItem("tango-local-cards") ?? "{}").state?.localCards ?? [],
    sessionsByDeckId: JSON.parse(window.localStorage.getItem("tango-study") ?? "{}").state?.sessionsByDeckId ?? {},
  }));

export interface FixtureAuthSeedOptions extends AnonymousAuthOptions {
  /** Logical UID of the anonymous user created after a linked user signs out. */
  nextUser?: string;
}

export interface FixturePageSeedOptions {
  /** Logical UID from the YAML fixture. The first documented user is used by default. */
  user?: string;
  /** Set to false only when a test intentionally uses the real Auth emulator. */
  auth?: FixtureAuthSeedOptions | false;
  /** Additional per-test preferences layered over the normalized YAML state. */
  preferences?: E2EConfigOverrides | false;
  localData?: boolean;
  studySessions?: boolean;
}

export interface FixtureApplyOptions extends FixturePageSeedOptions {
  remote?: boolean;
}

export interface E2EFixture {
  caseId: string;
  category: FixtureCategory;
  /** Repository-relative path to the YAML file selected by the documented test case. */
  path: string;
  state: FixtureState;
  user: (logicalUid?: string) => FixtureUser;
  deck: (logicalId?: string) => FixtureDeck;
  card: (logicalId?: string) => FixtureCard;
  session: (logicalDeckId?: string) => FixtureStudySession;
  uid: (logicalUid: string) => string;
  id: (logicalId: string) => string;
  /** Returns an independent view with selected logical users mapped to caller-provided runtime UIDs. */
  remapUsers: (users: Readonly<Record<string, string>>) => E2EFixture;
  seedRemote: () => Promise<void>;
  seedPage: (page: Page, options?: FixturePageSeedOptions) => Promise<void>;
  apply: (page: Page, options?: FixtureApplyOptions) => Promise<void>;
}

const requireLogicalValue = <Value>(values: ReadonlyMap<string, Value>, kind: string, logicalId?: string): Value => {
  const value = logicalId === undefined ? values.values().next().value : values.get(logicalId);
  if (value === undefined) {
    throw new Error(
      logicalId === undefined ? `YAML fixture has no ${kind}` : `YAML fixture has no ${kind} named ${logicalId}`
    );
  }
  return value;
};

const resolveNextAuthUser = (
  users: ReadonlyMap<string, FixtureUser>,
  selectedUser: FixtureUser,
  authOptions: FixtureAuthSeedOptions
) => {
  if (authOptions.nextUser !== undefined && authOptions.nextUid !== undefined) {
    throw new Error("Fixture auth accepts nextUser or nextUid, not both");
  }
  if (authOptions.nextUser !== undefined) {
    return requireLogicalValue(users, "auth user", authOptions.nextUser);
  }
  return [...users.values()].find(
    (candidate) => candidate.provider === "anonymous" && candidate.uid !== selectedUser.uid
  );
};

const seedFixturePreferences = async (
  page: Page,
  preferences: FixtureState["browser"]["preferences"],
  overrides: FixturePageSeedOptions["preferences"]
) => {
  if (overrides === false) return;
  await seedConfig(page, {
    ...preferences,
    ...overrides,
    appearance: { ...preferences.appearance, ...overrides?.appearance },
    study: { ...preferences.study, ...overrides?.study },
    controls: { ...preferences.controls, ...overrides?.controls },
  });
};

const seedFixtureLocalData = async (page: Page, state: FixtureState, shouldSeed: boolean | undefined) => {
  if (shouldSeed === false) return;
  await seedLocalData(page, {
    decks: state.browser.localDecks.map((deck) => ({ ...deck })),
    cards: state.browser.localCards.map((card) => ({ ...card })),
  });
};

const seedFixtureAuth = async (
  page: Page,
  fixture: {
    users: ReadonlyMap<string, FixtureUser>;
    selectedUser: FixtureUser;
    options: FixturePageSeedOptions["auth"];
    namespace: TestNamespace;
  }
) => {
  if (fixture.options === false) return;
  const options = fixture.options ?? {};
  const nextUser = resolveNextAuthUser(fixture.users, fixture.selectedUser, options);
  const { nextUser: _nextUser, ...overrides } = options;
  const inferredNextUid =
    nextUser?.uid ?? (fixture.selectedUser.provider === "google" ? fixture.namespace.id("signed-out-user") : undefined);
  await routeAnonymousAuth(page, fixture.selectedUser.uid, {
    ...overrides,
    linked: overrides.linked ?? fixture.selectedUser.provider === "google",
    ...(overrides.nextUid === undefined && inferredNextUid !== undefined ? { nextUid: inferredNextUid } : {}),
  });
};

const seedFixtureStudySessions = async (page: Page, state: FixtureState, shouldSeed: boolean | undefined) => {
  const { studySessions } = state.browser;
  if (shouldSeed === false || Object.keys(studySessions).length === 0) return;
  const sessionDeckIds = new Set(Object.keys(studySessions));
  const deckNames = [...state.remote.decks, ...state.browser.localDecks]
    .filter(({ id }) => sessionDeckIds.has(id))
    .map(({ name }) => name);
  // Auth initialization clears the previous identity's study state, so sessions must be written after it settles.
  await seedStudySessions(page, studySessions, deckNames);
};

function createE2EFixture(
  source: FixtureSource,
  namespace: TestNamespace,
  userOverrides: Readonly<Record<string, string>> = {}
): E2EFixture {
  const namespaced = namespaceFixture(source, namespace, userOverrides);
  const seedRemote = async () => {
    // Seed parent Decks first so every observable intermediate state preserves Card references.
    await Promise.all(namespaced.state.remote.decks.map((deck) => setDocument("deck", deck.id, { ...deck })));
    await Promise.all(namespaced.state.remote.cards.map((card) => setDocument("card", card.id, { ...card })));
  };

  const seedPage = async (page: Page, options: FixturePageSeedOptions = {}) => {
    const selectedUser = requireLogicalValue(namespaced.users, "auth user", options.user);
    await seedFixturePreferences(page, namespaced.state.browser.preferences, options.preferences);
    await seedFixtureLocalData(page, namespaced.state, options.localData);
    await seedFixtureAuth(page, {
      users: namespaced.users,
      selectedUser,
      options: options.auth,
      namespace,
    });
    await seedFixtureStudySessions(page, namespaced.state, options.studySessions);
  };

  const fixture: E2EFixture = {
    caseId: source.caseId,
    category: source.category,
    path: source.path,
    state: namespaced.state,
    user: (logicalUid) => requireLogicalValue(namespaced.users, "auth user", logicalUid),
    deck: (logicalId) => requireLogicalValue(namespaced.decks, "Deck", logicalId),
    card: (logicalId) => requireLogicalValue(namespaced.cards, "Card", logicalId),
    session: (logicalDeckId) => requireLogicalValue(namespaced.sessions, "Study session", logicalDeckId),
    uid: namespaced.uid,
    id: namespaced.id,
    remapUsers: (users) => createE2EFixture(source, namespace, { ...userOverrides, ...users }),
    seedRemote,
    seedPage,
    apply: async (page, options = {}) => {
      if (options.remote !== false) await seedRemote();
      await seedPage(page, options);
    },
  };
  return fixture;
}

const firestoreValue = (value: unknown): object => {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
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
        timestampValue?: string;
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
  const documents: FirestoreDocument[] = [];
  const appendPage = async (pageToken?: string): Promise<void> => {
    const url = new URL(`${firestoreBase}/${collection}`);
    url.searchParams.set("pageSize", "1000");
    if (pageToken !== undefined) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url, { headers: { Authorization: "Bearer owner" } });
    if (!response.ok) throw new Error(`Firestore list failed: ${response.status} ${await response.text()}`);
    const body = (await response.json()) as {
      documents?: FirestoreDocument[];
      nextPageToken?: string;
    };
    documents.push(...(body.documents ?? []));
    if (body.nextPageToken !== undefined && body.nextPageToken !== "") await appendPage(body.nextPageToken);
  };

  // All workers share emulator collections, so isolation assertions must include documents beyond Firestore's page cap.
  await appendPage();
  return documents;
};

export const documentId = (document: FirestoreDocument) => document.name.split("/").at(-1) ?? "";

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
