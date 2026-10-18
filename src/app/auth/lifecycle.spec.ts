import type { User } from "firebase/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthSession, replaceAuthSession } from "@/entities/auth";

type CacheConstraint = { field: string; operator: string; value: string };
type CacheCollection = { name: string };
type CacheQuery = { collection: CacheCollection; constraints: CacheConstraint[] };

const control = vi.hoisted(() => ({
  auth: { currentUser: null as User | null },
  observe: undefined as ((user: User | null) => void) | undefined,
  authError: undefined as ((error: Error) => void) | undefined,
  before: undefined as ((user: User | null) => Promise<void>) | undefined,
  abort: undefined as (() => void) | undefined,
  network: true,
  pendingChanges: [] as { collection: string; uid: string }[],
  cacheRead: Promise.resolve() as Promise<void>,
  subscribed: "",
  ready: Promise.resolve() as Promise<void>,
  stops: [] as string[],
  anonymous: vi.fn(),
}));
vi.mock("@/shared/firebase", () => ({ auth: control.auth, db: {} }));
vi.mock("firebase/auth", () => ({
  onIdTokenChanged: (_auth: unknown, callback: (user: User | null) => void, error: (error: Error) => void) => {
    control.observe = callback;
    control.authError = error;
    return () => {
      control.observe = undefined;
      control.authError = undefined;
    };
  },
  beforeAuthStateChanged: (_auth: unknown, callback: (user: User | null) => Promise<void>, abort: () => void) => {
    control.before = callback;
    control.abort = abort;
    return () => {
      control.before = undefined;
      control.abort = undefined;
    };
  },
  signInAnonymously: control.anonymous,
}));
vi.mock("firebase/firestore", () => ({
  disableNetwork: () => {
    control.network = false;
    return Promise.resolve();
  },
  enableNetwork: () => {
    control.network = true;
    return Promise.resolve();
  },
  collection: (_db: unknown, name: string): CacheCollection => ({ name }),
  query: (collection: CacheCollection, ...constraints: CacheConstraint[]): CacheQuery => ({ collection, constraints }),
  where: (field: string, operator: string, value: string): CacheConstraint => ({ field, operator, value }),
  getDocsFromCache: async (query: CacheQuery) => {
    await control.cacheRead;
    return {
      metadata: {
        hasPendingWrites: control.pendingChanges.some(
          (change) =>
            change.collection === query.collection.name &&
            query.constraints.every(
              (constraint) =>
                constraint.field === "uid" && constraint.operator === "==" && change.uid === constraint.value
            )
        ),
      },
    };
  },
}));
vi.mock("../firestore-subscriptions", () => ({
  startFirestoreSubscriptions: (uid: string) => {
    control.subscribed = uid;
    return {
      ready: control.ready,
      stop: () => {
        control.stops.push(uid);
        control.subscribed = "";
      },
    };
  },
}));

import { startAuthSession } from "./lifecycle";
const user = (uid: string, isAnonymous = true, displayName: string | null = null) =>
  ({ uid, isAnonymous, providerData: [{ displayName }] }) as unknown as User;
let stop: () => void = () => undefined;
async function publish(value: User | null) {
  control.auth.currentUser = value;
  control.observe?.(value);
  await vi.waitUntil(() => {
    const session = getAuthSession();
    return value
      ? session.status === "authenticated" && session.uid === value.uid && session.isAnonymous === value.isAnonymous
      : session.status === "authenticating";
  });
}

describe("Authentication and sync lifecycle [ACCOUNT-01 ACCOUNT-03 ACCOUNT-04 PERSISTENCE-04]", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    control.auth.currentUser = null;
    control.network = false;
    control.pendingChanges = [];
    control.cacheRead = Promise.resolve();
    control.ready = Promise.resolve();
    control.subscribed = "";
    control.stops = [];
    control.anonymous.mockReset().mockReturnValue(new Promise(() => undefined));
    replaceAuthSession({ status: "initializing" });
    stop = startAuthSession();
  });
  afterEach(() => stop());

  it("keeps anonymous startup offline before making editing available", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `publish` with the prepared inputs.
    await publish(user("anonymous"));
    // Then: Verify the expected result in the assertions below.
    expect(control.network).toBe(false);
    expect(control.subscribed).toBe("anonymous");
    expect(getAuthSession()).toMatchObject({ uid: "anonymous", isAnonymous: true });
  });
  it("enables sync after the same UID is linked", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `publish` with the prepared inputs.
    await publish(user("same"));
    await publish(user("same", false, "Account Owner"));
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(control.network).toBe(true));
    expect(control.stops).toEqual(["same"]);
    expect(control.subscribed).toBe("same");
    expect(getAuthSession()).toEqual({
      status: "authenticated",
      uid: "same",
      isAnonymous: false,
      displayName: "Account Owner",
    });
  });
  it("ACCOUNT-15 blocks signout while restored cache changes are pending in all collections", async () => {
    // Given: Use this case's inputs and any shared test setup.

    await publish(user("account", false));
    control.pendingChanges = ["deck", "card", "studySession", "studyAnswer"].map((collection) => ({
      collection,
      uid: "account",
    }));
    // When: Attempt to sign out of the prepared account.
    // Then: Enforce the pending-change guard and retain or release the account as specified.
    await expect(control.before?.(null)).rejects.toThrow("Sync changes");
    expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "account" });
    expect(control.subscribed).toBe("account");
    expect(control.stops).toEqual([]);
    expect(control.network).toBe(true);
  });
  it.each(["deck", "card", "studySession", "studyAnswer"])(
    "ACCOUNT-15 blocks signout when only the current account's %s changes are pending",
    async (collection) => {
      // Given: Use this case's inputs and any shared test setup.

      await publish(user("account", false, "Account Owner"));
      control.pendingChanges = [{ collection, uid: "account" }];

      // When: Attempt to sign out of the prepared account.

      // Then: Enforce the pending-change guard and retain or release the account as specified.
      await expect(control.before?.(null)).rejects.toThrow("Sync changes");

      expect(getAuthSession()).toEqual({
        status: "authenticated",
        uid: "account",
        isAnonymous: false,
        displayName: "Account Owner",
      });
      expect(control.auth.currentUser?.uid).toBe("account");
      expect(control.subscribed).toBe("account");
      expect(control.stops).toEqual([]);
      expect(control.network).toBe(true);
    }
  );
  it("ACCOUNT-03 permits signout when cached pending changes belong only to another account", async () => {
    // Given: Use this case's inputs and any shared test setup.

    await publish(user("account", false));
    control.pendingChanges = ["deck", "card", "studySession", "studyAnswer"].map((collection) => ({
      collection,
      uid: "other-account",
    }));

    // When: Attempt to sign out of the prepared account.

    // Then: Enforce the pending-change guard and retain or release the account as specified.
    await expect(control.before?.(null)).resolves.toBeUndefined();

    expect(control.auth.currentUser?.uid).toBe("account");
    expect(control.network).toBe(false);
    expect(control.subscribed).toBe("");
    expect(control.stops).toEqual(["account"]);
    expect(getAuthSession().status).toBe("initializing");
  });
  it.each(["pending changes", "cache read failure"])(
    "ACCOUNT-15 ACCOUNT-17 closes editing while checking sync and restores the account after %s",
    async (outcome) => {
      // Given: Prepare `cacheRead`, `expectedError` and any shared test state below.
      await publish(user("account", false, "Account Owner"));
      const cacheRead = Promise.withResolvers<void>();
      control.cacheRead = cacheRead.promise;
      control.pendingChanges = [{ collection: "card", uid: "account" }];
      const expectedError = outcome === "pending changes" ? "Sync changes" : "cache read failed";
      // When: Exercise `control.before` with the prepared inputs.
      const authChange = control.before?.(null);

      // Then: Verify the expected result in the assertions below.
      await vi.waitFor(() => expect(getAuthSession().status).toBe("initializing"));
      expect(control.subscribed).toBe("account");
      expect(control.network).toBe(true);
      expect(control.stops).toEqual([]);
      // When: Apply the operation or event under test.
      if (outcome === "pending changes") cacheRead.resolve();
      else cacheRead.reject(new Error(expectedError));
      // Then: Verify the expected result in the assertions below.
      await expect(authChange).rejects.toThrow(expectedError);

      expect(getAuthSession()).toEqual({
        status: "authenticated",
        uid: "account",
        isAnonymous: false,
        displayName: "Account Owner",
      });
      expect(control.subscribed).toBe("account");
      expect(control.network).toBe(true);
      expect(control.stops).toEqual([]);
    }
  );
  it("stops networking and old subscriptions before switching identity", async () => {
    // Given: Use this case's inputs and any shared test setup.
    await publish(user("account", false));
    // When: Exercise `control.before` with the prepared inputs.
    await control.before?.(null);
    // Then: Verify the expected result in the assertions below.
    expect(control.auth.currentUser?.uid).toBe("account");
    expect(control.network).toBe(false);
    expect(control.subscribed).toBe("");
    expect(getAuthSession().status).toBe("initializing");
    // When: Exercise `publish` with the prepared inputs.
    await publish(null);
    // Then: Verify the expected result in the assertions below.
    expect(control.anonymous).toHaveBeenCalledOnce();
  });
  it("waits for cached data through a same-UID token refresh", async () => {
    // Given: Prepare `ready` and any shared test state below.
    const ready = Promise.withResolvers<void>();
    control.ready = ready.promise;
    control.auth.currentUser = user("same");
    // When: Exercise `control.observe` with the prepared inputs.
    control.observe?.(control.auth.currentUser);
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(control.subscribed).toBe("same"));
    // When: Exercise `control.observe` with the prepared inputs.
    control.observe?.(control.auth.currentUser);
    await Promise.resolve();
    // Then: Verify the expected result in the assertions below.
    expect(getAuthSession().status).toBe("initializing");
    // When: Apply the operation or event under test.
    ready.resolve();
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "same" }));
    expect(control.stops).toEqual([]);
  });
  it("ignores an old identity's delayed startup failure", async () => {
    // Given: Prepare `oldReady` and any shared test state below.
    const oldReady = Promise.withResolvers<void>();
    control.ready = oldReady.promise;
    control.auth.currentUser = user("old");
    // When: Exercise `control.observe` with the prepared inputs.
    control.observe?.(control.auth.currentUser);
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(control.subscribed).toBe("old"));
    // When: Apply the operation or event under test.
    control.ready = Promise.resolve();
    await control.before?.(user("new"));
    await publish(user("new"));
    oldReady.reject(new Error("old subscription failure"));
    await Promise.resolve();
    await Promise.resolve();
    // Then: Verify the expected result in the assertions below.
    expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "new" });
    expect(control.subscribed).toBe("new");
  });
  it("reports a shared anonymous bootstrap failure after repeated initialization notifications", async () => {
    // Given: Prepare `bootstrap` and any shared test state below.
    const bootstrap = Promise.withResolvers<void>();
    control.anonymous.mockReturnValueOnce(bootstrap.promise);
    // When: Exercise `publish` with the prepared inputs.
    await publish(null);
    await publish(null);
    const error = new Error("anonymous sign-in failed");
    bootstrap.reject(error);
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getAuthSession()).toEqual({ status: "error", source: "auth", error }));
    expect(control.anonymous).toHaveBeenCalledOnce();
    expect(control.network).toBe(false);
    expect(control.subscribed).toBe("");
  });
  it("ACCOUNT-04 reports the auth observer failure and retains the error after cleanup", () => {
    // Given: Prepare `error` and any shared test state below.
    const error = new Error("auth observer failed");
    // When: Exercise `control.authError` with the prepared inputs.
    control.authError?.(error);
    // Then: Verify the expected result in the assertions below.
    expect(getAuthSession()).toEqual({ status: "error", source: "auth", error });

    // When: Exercise `stop` with the prepared inputs.
    stop();

    // Then: Verify the expected result in the assertions below.
    expect(getAuthSession()).toEqual({ status: "error", source: "auth", error });
  });
  it.each(["success", "failure"])(
    "ACCOUNT-04 prevents a delayed subscription startup %s from publishing after cleanup",
    async (outcome) => {
      // Given: Prepare `ready` and any shared test state below.
      const ready = Promise.withResolvers<void>();
      control.ready = ready.promise;
      control.auth.currentUser = user("account", false);
      // When: Exercise `control.observe` with the prepared inputs.
      control.observe?.(control.auth.currentUser);
      // Then: Verify the expected result in the assertions below.
      await vi.waitFor(() => expect(control.subscribed).toBe("account"));

      // When: Exercise `stop` with the prepared inputs.
      stop();
      // Then: Verify the expected result in the assertions below.
      expect(getAuthSession()).toEqual({ status: "initializing" });
      expect(control.subscribed).toBe("");
      expect(control.stops).toEqual(["account"]);
      // When: Apply the operation or event under test.
      if (outcome === "success") ready.resolve();
      else ready.reject(new Error("late subscription failure"));
      await ready.promise.catch(() => undefined);
      await Promise.resolve();

      // Then: Verify the expected result in the assertions below.
      expect(getAuthSession()).toEqual({ status: "initializing" });
      expect(control.subscribed).toBe("");
    }
  );
  it("ACCOUNT-03 returns a successful authenticated lifecycle to initialization after cleanup", async () => {
    // Given: Use this case's inputs and any shared test setup.
    await publish(user("account", false));

    // When: Exercise `stop` with the prepared inputs.
    stop();

    // Then: Verify the expected result in the assertions below.
    expect(getAuthSession()).toEqual({ status: "initializing" });
    expect(control.subscribed).toBe("");
    expect(control.stops).toEqual(["account"]);
  });
  it("restores the current account after a later auth callback aborts the switch", async () => {
    // Given: Use this case's inputs and any shared test setup.
    await publish(user("account", false));
    // When: Exercise `control.before` with the prepared inputs.
    await control.before?.(null);
    // Then: Verify the expected result in the assertions below.
    expect(control.network).toBe(false);
    expect(control.subscribed).toBe("");
    // When: Exercise `control.abort` with the prepared inputs.
    control.abort?.();
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "account" }));
    expect(control.network).toBe(true);
    expect(control.subscribed).toBe("account");
  });
  it("NAVIGATION-22 identifies subscription startup failures for local data recovery", async () => {
    // Given: Prepare `ready` and any shared test state below.
    const ready = Promise.withResolvers<void>();
    control.ready = ready.promise;
    control.auth.currentUser = user("anonymous");
    // When: Exercise `control.observe` with the prepared inputs.
    control.observe?.(control.auth.currentUser);
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(control.subscribed).toBe("anonymous"));
    const cause = new Error("cached data could not be loaded");
    // When: Apply the operation or event under test.
    ready.reject(cause);
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() =>
      expect(getAuthSession()).toMatchObject({
        status: "error",
        source: "firestore",
        error: cause,
      })
    );
    // When: Exercise `getAuthSession` with the prepared inputs.
    const session = getAuthSession();
    // Then: Verify the expected result in the assertions below.
    expect(session.status === "error" && session.error).toBe(cause);
    // When: Exercise `stop` with the prepared inputs.
    stop();
    // Then: Verify the expected result in the assertions below.
    expect(getAuthSession()).toEqual(session);
  });
});
