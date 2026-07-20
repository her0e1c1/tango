/**
 * @file Verifies the "storybook card fixtures" contract with automated examples.
 * The examples confirm that every default and long-card fixture receives a unique, predictable
 * identifier.
 */

import { describe, expect, it } from "vitest";

import { cards } from "@/storybook/fixture";

describe("storybook card fixtures", () => {
  it.each(["default", "long"] as const)("uses unique deterministic IDs for %s cards", (fixtureName) => {
    const ids = cards[fixtureName].map((card) => card.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(ids.map((_, index) => `${fixtureName}-card-${index + 1}`));
  });
});
