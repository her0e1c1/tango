import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";

import { AuthSessionProvider, useAuthSession } from "./AuthSessionProvider";
import { createAuthSessionStore } from "./authSessionStore";

describe("AuthSessionProvider", () => {
  it("exposes session updates to React consumers", () => {
    const store = createAuthSessionStore();
    const Wrapper = ({ children }: PropsWithChildren) => (
      <AuthSessionProvider store={store}>{children}</AuthSessionProvider>
    );
    const { result } = renderHook(useAuthSession, { wrapper: Wrapper });

    act(() => store.publish({ status: "authenticated", uid: "uid-a", isAnonymous: true, displayName: null }));

    expect(result.current).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });
  });

  it("requires a provider", () => {
    expect(() => renderHook(useAuthSession)).toThrow("useAuthSession must be used within AuthSessionProvider");
  });
});
