import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StrictMode, type PropsWithChildren } from "react";
import type { Auth, User, UserCredential } from "firebase/auth";
import { AuthProvider, createAuthStore, publishAuthenticatedUser, useAuth } from "@/auth/AuthContext";

const singletonMocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onAuthStateChanged: vi.fn(),
  signInAnonymously: vi.fn(),
}));

vi.mock("@/firebase", () => ({ auth: singletonMocks.auth }));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: singletonMocks.onAuthStateChanged,
  signInAnonymously: singletonMocks.signInAnonymously,
}));

const uninitializedCallback = (): never => {
  throw new Error("Callback was used before auth observer setup");
};

describe("Auth store", () => {
  it("starts without exposing a UID", () => {
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn(),
      signInAnonymously: vi.fn(),
    });

    expect(store.getSnapshot()).toEqual({ status: "initializing" });
    expect("uid" in store.getSnapshot()).toBe(false);
  });

  it("starts one app-lifetime observer on the first subscriber", () => {
    const stopObserver = vi.fn();
    const onAuthStateChanged = vi.fn(() => stopObserver);
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged,
      signInAnonymously: vi.fn(),
    });

    expect(onAuthStateChanged).not.toHaveBeenCalled();

    const unsubscribeFirst = store.subscribe(vi.fn());
    unsubscribeFirst();
    const unsubscribeSecond = store.subscribe(vi.fn());
    unsubscribeSecond();

    expect(onAuthStateChanged).toHaveBeenCalledTimes(1);
    expect(stopObserver).not.toHaveBeenCalled();

    store.dispose();
    expect(stopObserver).toHaveBeenCalledTimes(1);
  });

  it("ignores an in-flight anonymous sign-in failure after disposal", async () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    let rejectSignIn: (error: unknown) => void = uninitializedCallback;
    const signInAttempt = new Promise<UserCredential>((_resolve, reject) => {
      rejectSignIn = reject;
    });
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn((_auth, onUser) => {
        publishUser = onUser;
        return vi.fn();
      }),
      signInAnonymously: vi.fn(() => signInAttempt),
    });
    const listener = vi.fn();
    store.subscribe(listener);
    publishUser(null);
    expect(store.getSnapshot()).toEqual({ status: "signedOut" });

    store.dispose();
    rejectSignIn(new Error("late failure"));
    await signInAttempt.catch(() => undefined);

    expect(store.getSnapshot()).toEqual({ status: "signedOut" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("ignores queued auth observer callbacks after disposal", () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    const signInAnonymously = vi.fn(() => new Promise<never>(() => undefined));
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn((_auth, onUser) => {
        publishUser = onUser;
        return vi.fn();
      }),
      signInAnonymously,
    });
    const listener = vi.fn();
    store.subscribe(listener);

    store.dispose();
    publishUser({ uid: "uid-a" } as User);
    publishUser(null);

    expect(store.getSnapshot()).toEqual({ status: "initializing" });
    expect(signInAnonymously).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  it("rejects subscriptions after disposal", () => {
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn(() => vi.fn()),
      signInAnonymously: vi.fn(),
    });
    store.subscribe(vi.fn());
    store.dispose();

    expect(() => store.subscribe(vi.fn())).toThrowError("Auth store has been disposed");
  });

  it("ignores authenticated-user publications after disposal", () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn((_auth, onUser) => {
        publishUser = onUser;
        return vi.fn();
      }),
      signInAnonymously: vi.fn(),
    });
    store.subscribe(vi.fn());
    const user = { uid: "uid-a", displayName: null } as User;
    publishUser(user);
    store.dispose();

    store.publishAuthenticatedUser({ uid: "uid-a", displayName: "Ada" } as User);

    expect(store.getSnapshot()).toEqual({ status: "authenticated", user, uid: "uid-a" });
  });

  it("exposes only a user confirmed by the auth observer", () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn((_auth, onUser) => {
        publishUser = onUser;
        return vi.fn();
      }),
      signInAnonymously: vi.fn(),
    });
    const listener = vi.fn();
    store.subscribe(listener);
    const user = { uid: "uid-a" } as User;

    publishUser(user);

    expect(store.getSnapshot()).toEqual({ status: "authenticated", user, uid: "uid-a" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("starts anonymous sign-in once for duplicate signed-out callbacks", () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    const signInAnonymously = vi.fn(() => new Promise<never>(() => undefined));
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn((_auth, onUser) => {
        publishUser = onUser;
        return vi.fn();
      }),
      signInAnonymously,
    });
    store.subscribe(vi.fn());

    publishUser(null);
    publishUser(null);

    expect(store.getSnapshot()).toEqual({ status: "signedOut" });
    expect("uid" in store.getSnapshot()).toBe(false);
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it("starts a new anonymous episode after an authenticated user signs out", () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    const signInAnonymously = vi.fn(() => new Promise<never>(() => undefined));
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn((_auth, onUser) => {
        publishUser = onUser;
        return vi.fn();
      }),
      signInAnonymously,
    });
    store.subscribe(vi.fn());

    publishUser(null);
    publishUser({ uid: "uid-a" } as User);
    publishUser(null);

    expect(signInAnonymously).toHaveBeenCalledTimes(2);
  });

  it("publishes observer errors without retaining a UID", () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    let publishError: (error: unknown) => void = uninitializedCallback;
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn((_auth, onUser, onError) => {
        publishUser = onUser;
        publishError = onError;
        return vi.fn();
      }),
      signInAnonymously: vi.fn(),
    });
    store.subscribe(vi.fn());
    publishUser({ uid: "uid-a" } as User);
    const error = new Error("observer failed");

    publishError(error);

    expect(store.getSnapshot()).toEqual({ status: "error", error });
    expect("uid" in store.getSnapshot()).toBe(false);
  });

  it("publishes anonymous sign-in errors without a UID", async () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    const error = new Error("anonymous sign-in failed");
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn((_auth, onUser) => {
        publishUser = onUser;
        return vi.fn();
      }),
      signInAnonymously: vi.fn().mockRejectedValue(error),
    });
    store.subscribe(vi.fn());

    publishUser(null);

    await vi.waitFor(() => expect(store.getSnapshot()).toEqual({ status: "error", error }));
    expect("uid" in store.getSnapshot()).toBe(false);
  });

  it("ignores a stale sign-in failure after authentication succeeds", async () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    let rejectSignIn: (error: unknown) => void = uninitializedCallback;
    const signInAttempt = new Promise<UserCredential>((_resolve, reject) => {
      rejectSignIn = reject;
    });
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn((_auth, onUser) => {
        publishUser = onUser;
        return vi.fn();
      }),
      signInAnonymously: vi.fn(() => signInAttempt),
    });
    store.subscribe(vi.fn());
    const user = { uid: "uid-a" } as User;
    publishUser(null);
    publishUser(user);

    rejectSignIn(new Error("late failure"));
    await signInAttempt.catch(() => undefined);

    expect(store.getSnapshot()).toEqual({ status: "authenticated", user, uid: "uid-a" });
  });

  it("publishes a synchronous observer setup error", () => {
    const error = new Error("observer setup failed");
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn(() => {
        throw error;
      }),
      signInAnonymously: vi.fn(),
    });

    expect(() => store.subscribe(vi.fn())).not.toThrow();
    expect(store.getSnapshot()).toEqual({ status: "error", error });
    expect("uid" in store.getSnapshot()).toBe(false);
  });

  it("publishes a synchronous anonymous sign-in error", () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    const error = new Error("sign-in setup failed");
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn((_auth, onUser) => {
        publishUser = onUser;
        return vi.fn();
      }),
      signInAnonymously: vi.fn(() => {
        throw error;
      }),
    });
    store.subscribe(vi.fn());

    expect(() => publishUser(null)).not.toThrow();
    expect(store.getSnapshot()).toEqual({ status: "error", error });
  });

  it("refreshes authenticated metadata only for the confirmed UID", () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged: vi.fn((_auth, onUser) => {
        publishUser = onUser;
        return vi.fn();
      }),
      signInAnonymously: vi.fn(),
    });
    store.subscribe(vi.fn());
    publishUser({ uid: "uid-a", displayName: null } as User);
    const refreshedUser = { uid: "uid-a", displayName: "Ada" } as User;

    store.publishAuthenticatedUser(refreshedUser);
    store.publishAuthenticatedUser({ uid: "uid-b" } as User);

    expect(store.getSnapshot()).toEqual({ status: "authenticated", user: refreshedUser, uid: "uid-a" });
  });
});

describe("AuthProvider", () => {
  it("uses the injected store through StrictMode without restarting its observer", () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    const onAuthStateChanged = vi.fn((_auth, onUser) => {
      publishUser = onUser;
      return vi.fn();
    });
    const store = createAuthStore({
      auth: {} as Auth,
      onAuthStateChanged,
      signInAnonymously: vi.fn(),
    });
    const Wrapper = ({ children }: PropsWithChildren) => (
      <StrictMode>
        <AuthProvider store={store}>{children}</AuthProvider>
      </StrictMode>
    );

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    expect(result.current).toEqual({ status: "initializing" });

    const user = { uid: "uid-a" } as User;
    act(() => publishUser(user));

    expect(result.current).toEqual({ status: "authenticated", user, uid: "uid-a" });
    expect(onAuthStateChanged).toHaveBeenCalledTimes(1);
  });

  it("uses the module singleton by default and publishes same-UID metadata", () => {
    let publishUser: (user: User | null) => void = uninitializedCallback;
    singletonMocks.onAuthStateChanged.mockImplementation((_auth, onUser) => {
      publishUser = onUser;
      return vi.fn();
    });
    const Wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    const user = { uid: "uid-a", displayName: null } as User;
    act(() => publishUser(user));
    const refreshedUser = { uid: "uid-a", displayName: "Ada" } as User;

    act(() => publishAuthenticatedUser(refreshedUser));

    expect(result.current).toEqual({ status: "authenticated", user: refreshedUser, uid: "uid-a" });
    expect(singletonMocks.onAuthStateChanged).toHaveBeenCalledTimes(1);
  });
});
