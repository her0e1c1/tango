import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeckRemoteReadState } from "../model/remoteReadStore";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";

const mocks = vi.hoisted(() => ({
  state: {
    uid: "uid-a",
    status: "ready",
    syncStatus: "synced",
  } as Omit<DeckRemoteReadState, "start" | "stop" | "retry">,
  retry: vi.fn(),
}));

vi.mock("../model/remoteReadStore", () => ({
  deckRemoteReadStore: {
    subscribe: () => () => undefined,
    getState: () => Object.assign(mocks.state, { retry: mocks.retry }),
    getInitialState: () => Object.assign(mocks.state, { retry: mocks.retry }),
  },
}));

import { useDeckRead } from "../index";

const authenticatedWrapper = ({ children }: PropsWithChildren) => (
  <RemoteReadScopeProvider uid="uid-a">{children}</RemoteReadScopeProvider>
);
const signedOutWrapper = ({ children }: PropsWithChildren) => (
  <RemoteReadScopeProvider uid={null}>{children}</RemoteReadScopeProvider>
);

describe("Deck read lifecycle hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state = { uid: "uid-a", status: "ready", syncStatus: "synced" };
  });

  it("exposes lifecycle state and retry", () => {
    const { result } = renderHook(useDeckRead, { wrapper: authenticatedWrapper });
    void result.current.retry();

    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("synced");
    expect(mocks.retry).toHaveBeenCalledOnce();
  });

  it("hides lifecycle state while the App scope expects another UID", () => {
    mocks.state = { uid: "uid-b", status: "ready", syncStatus: "synced" };

    const { result } = renderHook(useDeckRead, { wrapper: authenticatedWrapper });

    expect(result.current.status).toBe("loading");
    expect(result.current.syncStatus).toBeUndefined();
  });

  it("is idle immediately when the App scope is signed out", () => {
    const { result } = renderHook(useDeckRead, { wrapper: signedOutWrapper });

    expect(result.current.status).toBe("idle");
  });
});
