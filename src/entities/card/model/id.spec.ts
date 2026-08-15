import { describe, expect, it } from "vitest";

import { generateCardId } from "./id";

const GENERATED_ID_PATTERN = /^[A-Za-z0-9]{20}$/;

describe("generateCardId", () => {
  it("generates an ID without Firebase", () => {
    expect(generateCardId()).toMatch(GENERATED_ID_PATTERN);
  });
});
