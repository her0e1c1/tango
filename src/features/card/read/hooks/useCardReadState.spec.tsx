import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetCardRead, setCardReadError, setCardReadLoading, setCardReadReady } from "../model/readLifecycleStore";
import { useCardReadState } from "../index";

describe("Card remote hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCardRead();
  });

  it("exposes the current read lifecycle", () => {
    setCardReadLoading("uid-a");
    setCardReadReady("uid-a", true);
    const { result } = renderHook(useCardReadState);

    expect(result.current.status).toBe("ready");
    expect(result.current.serverConfirmed).toBe(true);
  });

  it("exposes errors in a terminal state", () => {
    const error = new Error("terminal");
    setCardReadLoading("uid-a");
    setCardReadError("uid-a", error);

    const { result } = renderHook(useCardReadState);

    expect(result.current.error).toBe(error);
    expect(result.current.serverConfirmed).toBe(false);
  });

  it("ignores lifecycle reports from a replaced UID", () => {
    setCardReadLoading("uid-a");
    setCardReadLoading("uid-b");
    setCardReadReady("uid-a", true);
    setCardReadError("uid-a", new Error("stale"));

    const { result } = renderHook(useCardReadState);

    expect(result.current.status).toBe("loading");
    expect(result.current.serverConfirmed).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it("resets only the matching UID", () => {
    setCardReadLoading("uid-a");
    setCardReadReady("uid-a", true);
    resetCardRead("uid-b");

    const { result } = renderHook(useCardReadState);

    expect(result.current.status).toBe("ready");
  });

  it("reports idle after the App lifecycle resets Card reads", () => {
    setCardReadLoading("uid-a");
    setCardReadReady("uid-a", true);
    resetCardRead("uid-a");

    const { result } = renderHook(useCardReadState);

    expect(result.current.status).toBe("idle");
  });
});
