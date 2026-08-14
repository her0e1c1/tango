import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAuthSession } from "./hooks";
import { replaceAuthSession } from "./store";

describe("useAuthSession", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("reads session updates from the global entity store", () => {
    const { result } = renderHook(useAuthSession);

    act(() =>
      replaceAuthSession({
        status: "authenticated",
        uid: "uid-a",
        isAnonymous: true,
        displayName: null,
      })
    );

    expect(result.current).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });
  });
});
