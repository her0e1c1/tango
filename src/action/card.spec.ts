/**
 * @file Verifies the "card action" contract with automated examples.
 * The examples make the expected CSV export behavior concrete.
 */

import type { Card } from "@/entities/card";

import { expect, it, describe } from "vitest";

import * as card from "@/action/card";
import { createCard } from "@/test/factories";

describe("card action", () => {
  describe.concurrent("toRow", () => {
    it("should be toRow", async () => {
      const c = { frontText: "front", backText: "back", tags: ["a", "b", "c"], uniqueKey: "123" } as Card;
      expect(card.toRow(c)).toEqual(["front", "back", "a,b,c", "123"]);
    });
    it("should be empty", async () => {
      const c = createCard({ frontText: "", backText: "", tags: [], uniqueKey: "" });
      expect(card.toRow(c)).toEqual(["", "", "", ""]);
    });
  });
});
