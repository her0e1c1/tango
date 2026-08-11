import { describe, expect, it, vi } from "vitest";

import { createSessionStore } from "@/entities/session/model/sessionStore";

describe("sessionStore", () => {
  it("starts without an identity", () => {
    const store = createSessionStore();

    expect(store.getSnapshot()).toEqual({ status: "initializing" });
    expect("uid" in store.getSnapshot()).toBe(false);
  });

  it("publishes snapshots to active subscribers", () => {
    const store = createSessionStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.publish({ status: "authenticated", uid: "uid-a", isAnonymous: true, displayName: null });
    unsubscribe();
    store.publish({ status: "signedOut" });

    expect(listener).toHaveBeenCalledOnce();
    expect(store.getSnapshot()).toEqual({ status: "signedOut" });
  });

  it("accepts a deterministic initial snapshot", () => {
    const store = createSessionStore({
      status: "authenticated",
      uid: "storybook-user",
      isAnonymous: true,
      displayName: null,
    });

    expect(store.getSnapshot()).toEqual({
      status: "authenticated",
      uid: "storybook-user",
      isAnonymous: true,
      displayName: null,
    });
  });
});
