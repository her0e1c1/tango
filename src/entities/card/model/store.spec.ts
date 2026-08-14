import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { createCard } from "@/test/factories";
import { useCard, useCards } from "./hooks";
import { clearCards, replaceCards } from "./store";

describe("Card store", () => {
  beforeEach(clearCards);

  it("replaces and clears Cards", () => {
    const card = createCard({ id: "card-a" });
    const { result: cardsResult } = renderHook(useCards);
    const { result: selectedResult } = renderHook(() => useCard(card.id));

    act(() => replaceCards([card]));
    expect(cardsResult.current).toEqual([card]);
    expect(selectedResult.current).toEqual(card);

    act(clearCards);
    expect(cardsResult.current).toEqual([]);
    expect(selectedResult.current).toBeUndefined();
  });
});
