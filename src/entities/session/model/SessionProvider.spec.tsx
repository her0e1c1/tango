import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";

import { SessionProvider, useSession } from "@/entities/session/model/SessionProvider";
import { createSessionStore } from "@/entities/session/model/sessionStore";

describe("SessionProvider", () => {
  it("exposes session updates to React consumers", () => {
    const store = createSessionStore();
    const Wrapper = ({ children }: PropsWithChildren) => <SessionProvider store={store}>{children}</SessionProvider>;
    const { result } = renderHook(useSession, { wrapper: Wrapper });

    act(() => store.publish({ status: "authenticated", uid: "uid-a", isAnonymous: true, displayName: null }));

    expect(result.current).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });
  });

  it("requires a provider", () => {
    expect(() => renderHook(useSession)).toThrow("useSession must be used within SessionProvider");
  });
});
