/**
 * @file Verifies the "card action" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should be fromRow" and
 * "should be empty".
 */

import type { Card, CardRaw } from "@/entities/card";

import { expect, it, describe } from "vitest";

import * as card from "@/action/card";
import { createCard } from "@/test/factories";

describe("card action", () => {
  describe.concurrent("fromRow", () => {
    it("should be fromRow", async () => {
      const c = { frontText: "front", backText: "back", tags: ["a", "b", "c"], uniqueKey: "123" } as Card;
      expect(card.fromRow(["front", "back", "a,b,c", "123"])).toEqual(c);
    });
    it("should be empty", async () => {
      const c = { frontText: "", backText: "", tags: [], uniqueKey: "" } satisfies CardRaw;
      expect(card.fromRow([])).toEqual(c);
    });
  });

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
