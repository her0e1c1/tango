import { describe, expect, it } from "vitest";
import { isDefined } from "@/util";

describe("tsconfig path aliases", () => {
  it("resolves @ imports", () => {
    expect(isDefined("value")).toBe(true);
  });
});
