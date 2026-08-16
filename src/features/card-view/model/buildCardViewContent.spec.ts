import { describe, expect, it, vi } from "vitest";

import { createCard, createDeck } from "@/test/factories";
import { buildCardViewContent } from "./buildCardViewContent";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("buildCardViewContent", () => {
  it("maps Entity content and appearance to presentation values", () => {
    const card = createCard({ backText: "const answer = 42;", tags: ["typescript"] });
    const deck = createDeck({ category: "raw" });

    expect(buildCardViewContent(card, deck, true)).toEqual({
      text: card.backText,
      category: "typescript",
      code: true,
      dark: true,
    });
  });
});
