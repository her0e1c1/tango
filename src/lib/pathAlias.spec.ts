import { describe, expect, it } from "vitest";
import { isDefined } from "@src/util";

describe("tsconfig path aliases", () => {
  it("resolves @src imports", () => {
    expect(isDefined("value")).toBe(true);
  });
});
