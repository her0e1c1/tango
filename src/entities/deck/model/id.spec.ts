import { describe, expect, it } from "vitest";

import { generateDeckId } from "./id";

describe("generateDeckId", () => {
  it("generates an ID without Firebase", () => {
    expect(generateDeckId()).toMatch(/^[A-Za-z0-9]{20}$/);
  });
});
