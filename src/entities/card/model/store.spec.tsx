import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { createCard } from "@/test/factories";
import { useCard, useCards } from "./hooks";
import { cardStore, clearCards, replaceCards } from "./store";

describe("Card store", () => {
  beforeEach(clearCards);

  it("replaces and clears the Card collection", () => {
    const card = createCard({ id: "card" });

    replaceCards([card]);
    expect(cardStore.getState().cards).toEqual([card]);

    clearCards();
    expect(cardStore.getState().cards).toEqual([]);
  });

  it("exposes collection and individual Card selectors", () => {
    const card = createCard({ id: "card" });
    replaceCards([card]);

    expect(renderHook(useCards).result.current).toEqual([card]);
    expect(renderHook(() => useCard("card")).result.current).toEqual(card);
    expect(renderHook(() => useCard("missing")).result.current).toBeUndefined();
  });
});
