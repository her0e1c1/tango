import { describe, expect, it } from "vitest";

import { generateDeckId } from "./id";

const GENERATED_ID_PATTERN = /^[A-Za-z0-9]{20}$/;

describe("generateDeckId", () => {
  it("generates an ID without Firebase", () => {
    expect(generateDeckId()).toMatch(GENERATED_ID_PATTERN);
  });
});
