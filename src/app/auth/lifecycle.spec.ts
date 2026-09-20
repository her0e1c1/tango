import type { User } from "firebase/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthSession, replaceAuthSession } from "@/entities/auth";

const control = vi.hoisted(() => ({
  auth: { currentUser: null as User | null },
  observe: undefined as ((user: User | null) => void) | undefined,
  before: undefined as ((user: User | null) => Promise<void>) | undefined,
  network: true,
  pending: false,
  subscribed: "",
  ready: Promise.resolve() as Promise<void>,
  stops: [] as string[],
  anonymous: vi.fn(),
  migrate: vi.fn(),
}));
vi.mock("@/shared/firebase", () => ({ auth: control.auth, db: {} }));
vi.mock("firebase/auth", () => ({
  onIdTokenChanged: (_auth: unknown, callback: (user: User | null) => void) => {
    control.observe = callback;
    return () => {
      control.observe = undefined;
    };
  },
  beforeAuthStateChanged: (_auth: unknown, callback: (user: User | null) => Promise<void>) => {
    control.before = callback;
    return () => {
      control.before = undefined;
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
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocsFromCache: async () => ({ metadata: { hasPendingWrites: control.pending } }),
}));
vi.mock("@/shared/firestore-write", () => ({
  hasUnacknowledgedWrites: () => false,
  subscribeWriteErrors: () => () => undefined,
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
vi.mock("./migrateLegacyData", () => ({ migrateLegacyData: control.migrate }));

import { startAuthSession } from "./lifecycle";
const user = (uid: string, isAnonymous = true) => ({ uid, isAnonymous, providerData: [] }) as unknown as User;
let stop: () => void = () => undefined;
async function publish(value: User | null) {
  control.auth.currentUser = value;
  control.observe?.(value);
  await vi.waitUntil(() => getAuthSession().status === (value ? "authenticated" : "authenticating"));
}

describe("Authentication and sync lifecycle [ACCOUNT-01 ACCOUNT-03 ACCOUNT-04 PERSIST-04]", () => {
  beforeEach(() => {
    control.auth.currentUser = null;
    control.network = false;
    control.pending = false;
    control.ready = Promise.resolve();
    control.subscribed = "";
    control.stops = [];
    control.anonymous.mockReset().mockReturnValue(new Promise(() => undefined));
    control.migrate.mockReset().mockResolvedValue(undefined);
    replaceAuthSession({ status: "initializing" });
    stop = startAuthSession();
  });
  afterEach(() => stop());

  it("keeps anonymous startup offline before making editing available", async () => {
    await publish(user("anonymous"));
    expect(control.network).toBe(false);
    expect(control.subscribed).toBe("anonymous");
    expect(getAuthSession()).toMatchObject({ uid: "anonymous", isAnonymous: true });
  });
  it("enables sync after the same UID is linked", async () => {
    await publish(user("same"));
    await publish(user("same", false));
    await vi.waitFor(() => expect(control.network).toBe(true));
    expect(getAuthSession()).toMatchObject({ uid: "same", isAnonymous: false });
  });
  it("blocks signout while restored cache changes are pending", async () => {
    await publish(user("account", false));
    control.pending = true;
    await expect(control.before?.(null)).rejects.toThrow("Sync changes");
    expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "account" });
    expect(control.subscribed).toBe("account");
  });
  it("stops networking and old subscriptions before switching identity", async () => {
    await publish(user("account", false));
    await control.before?.(null);
    expect(control.auth.currentUser?.uid).toBe("account");
    expect(control.network).toBe(false);
    expect(control.subscribed).toBe("");
    expect(getAuthSession().status).toBe("initializing");
    await publish(null);
    expect(control.anonymous).toHaveBeenCalledOnce();
  });
  it("waits for cached data through a same-UID token refresh", async () => {
    const ready = Promise.withResolvers<void>();
    control.ready = ready.promise;
    control.auth.currentUser = user("same");
    control.observe?.(control.auth.currentUser);
    await vi.waitFor(() => expect(control.subscribed).toBe("same"));
    control.observe?.(control.auth.currentUser);
    await Promise.resolve();
    expect(getAuthSession().status).toBe("initializing");
    ready.resolve();
    await vi.waitFor(() => expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "same" }));
  });
  it("ignores an old identity's delayed startup failure", async () => {
    const oldMigration = Promise.withResolvers<void>();
    control.migrate.mockReturnValueOnce(oldMigration.promise);
    control.auth.currentUser = user("old");
    control.observe?.(control.auth.currentUser);
    await vi.waitFor(() => expect(control.migrate).toHaveBeenCalledWith("old"));
    await control.before?.(user("new"));
    await publish(user("new"));
    oldMigration.reject(new Error("old storage failure"));
    await Promise.resolve();
    await Promise.resolve();
    expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "new" });
    expect(control.subscribed).toBe("new");
  });
  it("does not start editing when legacy data cannot be saved", async () => {
    control.migrate.mockRejectedValueOnce(new Error("storage failed"));
    control.auth.currentUser = user("anonymous");
    control.observe?.(control.auth.currentUser);
    await vi.waitFor(() => expect(getAuthSession().status).toBe("error"));
    expect(control.network).toBe(false);
    expect(control.subscribed).toBe("");
  });
});
