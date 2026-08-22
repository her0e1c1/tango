import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { setCurrentUser, useCurrentUser } from "./store";

describe("currentUserStore", () => {
  beforeEach(() => setCurrentUser(null));

  it("exposes the current user and clears it", () => {
    const { result } = renderHook(useCurrentUser);

    act(() => setCurrentUser({ uid: "uid-a", isAnonymous: false, displayName: "Ada" }));
    expect(result.current).toEqual({ uid: "uid-a", isAnonymous: false, displayName: "Ada" });

    act(() => setCurrentUser(null));
    expect(result.current).toBeNull();
  });
});
