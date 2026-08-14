import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { cardRemoteReadStore } from "../model/remoteReadStore";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";

type CardReadState = ReturnType<typeof cardRemoteReadStore.getState>;

const mocks = vi.hoisted(() => ({
  state: {
    uid: "uid-a",
    status: "ready",
    syncStatus: "synced",
    itemsById: {},
  } as Omit<CardReadState, "start" | "stop" | "retry">,
  retry: vi.fn(),
}));

vi.mock("../model/remoteReadStore", () => ({
  cardRemoteReadStore: {
    subscribe: () => () => undefined,
    getState: () => Object.assign(mocks.state, { retry: mocks.retry }),
    getInitialState: () => Object.assign(mocks.state, { retry: mocks.retry }),
  },
}));

import { useCardReadState } from "../index";

const authenticatedWrapper = ({ children }: PropsWithChildren) => (
  <RemoteReadScopeProvider uid="uid-a">{children}</RemoteReadScopeProvider>
);
const unauthenticatedWrapper = ({ children }: PropsWithChildren) => (
  <RemoteReadScopeProvider uid={null}>{children}</RemoteReadScopeProvider>
);

describe("Card remote hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state = {
      uid: "uid-a",
      status: "ready",
      syncStatus: "synced",
      itemsById: {},
    };
  });

  it("exposes the current read lifecycle", () => {
    const { result } = renderHook(useCardReadState, { wrapper: authenticatedWrapper });

    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("synced");
  });

  it("exposes errors and retry in a terminal state", () => {
    const error = new Error("terminal");
    mocks.state = { uid: "uid-a", status: "error", error, itemsById: {} };

    const { result } = renderHook(useCardReadState, { wrapper: authenticatedWrapper });
    void result.current.retry();

    expect(result.current.error).toBe(error);
    expect(mocks.retry).toHaveBeenCalledOnce();
  });

  it("reports loading while the App scope expects another UID", () => {
    mocks.state = { uid: "uid-b", status: "ready", syncStatus: "synced", itemsById: {} };

    const { result } = renderHook(useCardReadState, { wrapper: authenticatedWrapper });

    expect(result.current.status).toBe("loading");
    expect(result.current.syncStatus).toBeUndefined();
  });

  it("reports idle immediately when the App scope is unauthenticated", () => {
    mocks.state = { uid: "uid-a", status: "ready", syncStatus: "synced", itemsById: {} };

    const { result } = renderHook(useCardReadState, { wrapper: unauthenticatedWrapper });

    expect(result.current.status).toBe("idle");
  });
});
