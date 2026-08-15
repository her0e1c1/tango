import { describe, expect, it } from "vitest";

import { generateCardId } from "./id";

describe("generateCardId", () => {
  it("generates an ID without Firebase", () => {
    expect(generateCardId()).toMatch(/^[A-Za-z0-9]{20}$/);
  });
});
