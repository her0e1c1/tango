import type { Deck } from "@/entities/deck";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRemoteReadStore, RemoteReadScopeProvider } from "@/shared/lib/remote-read";
import { DeckReadProvider, useDeckRead } from "../index";

const retry = vi.fn();
const store = createRemoteReadStore<Deck>({ subscribe: () => vi.fn() });

const wrapper = ({ children }: PropsWithChildren) => (
  <RemoteReadScopeProvider uid="uid-a">
    <DeckReadProvider store={store}>{children}</DeckReadProvider>
  </RemoteReadScopeProvider>
);

describe("Deck read lifecycle hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.setState({ uid: "uid-a", status: "ready", syncStatus: "synced", itemsById: {}, retry });
  });

  it("exposes lifecycle state and retry", () => {
    const { result } = renderHook(useDeckRead, { wrapper });
    void result.current.retry();

    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("synced");
    expect(retry).toHaveBeenCalledOnce();
  });

  it("hides lifecycle state while the App scope expects another UID", () => {
    store.setState({ uid: "uid-b", status: "ready", syncStatus: "synced", itemsById: {} });

    const { result } = renderHook(useDeckRead, { wrapper });

    expect(result.current.status).toBe("loading");
    expect(result.current.syncStatus).toBeUndefined();
  });
});
