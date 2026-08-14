import { renderHook } from "@testing-library/react";
import { act } from "react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";
import { resetCardRead, setCardReadError, setCardReadLoading, setCardReadReady } from "../model/readLifecycleStore";

import { useCardReadState } from "../index";

const authenticatedWrapper = ({ children }: PropsWithChildren) => (
  <RemoteReadScopeProvider uid="uid-a">{children}</RemoteReadScopeProvider>
);
const unauthenticatedWrapper = ({ children }: PropsWithChildren) => (
  <RemoteReadScopeProvider uid={null}>{children}</RemoteReadScopeProvider>
);
const replacementWrapper = ({ children }: PropsWithChildren) => (
  <RemoteReadScopeProvider uid="uid-b">{children}</RemoteReadScopeProvider>
);

describe("Card remote hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCardRead();
  });

  it("exposes the current read lifecycle", () => {
    setCardReadLoading("uid-a", vi.fn());
    setCardReadReady("uid-a", "synced");
    const { result } = renderHook(useCardReadState, { wrapper: authenticatedWrapper });

    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("synced");
  });

  it("exposes errors and retry in a terminal state", () => {
    const error = new Error("terminal");
    const retry = vi.fn();
    setCardReadLoading("uid-a", retry);
    setCardReadError("uid-a", error);

    const { result } = renderHook(useCardReadState, { wrapper: authenticatedWrapper });
    act(() => result.current.retry());

    expect(result.current.error).toBe(error);
    expect(retry).toHaveBeenCalledOnce();
  });

  it("reports loading while the App scope expects another UID", () => {
    setCardReadLoading("uid-b", vi.fn());
    setCardReadReady("uid-b", "synced");

    const { result } = renderHook(useCardReadState, { wrapper: authenticatedWrapper });

    expect(result.current.status).toBe("loading");
    expect(result.current.syncStatus).toBeUndefined();
  });

  it("ignores lifecycle reports from a replaced UID", () => {
    setCardReadLoading("uid-a", vi.fn());
    setCardReadLoading("uid-b", vi.fn());
    setCardReadReady("uid-a", "synced");
    setCardReadError("uid-a", new Error("stale"));

    const { result } = renderHook(useCardReadState, { wrapper: replacementWrapper });

    expect(result.current.status).toBe("loading");
    expect(result.current.syncStatus).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it("resets only the matching UID", () => {
    setCardReadLoading("uid-a", vi.fn());
    setCardReadReady("uid-a", "cached");
    resetCardRead("uid-b");

    const { result } = renderHook(useCardReadState, { wrapper: authenticatedWrapper });

    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("cached");
  });

  it("reports idle immediately when the App scope is unauthenticated", () => {
    setCardReadLoading("uid-a", vi.fn());
    setCardReadReady("uid-a", "synced");

    const { result } = renderHook(useCardReadState, { wrapper: unauthenticatedWrapper });

    expect(result.current.status).toBe("idle");
  });
});
