/**
 * @file Verifies the "tsconfig path aliases" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "resolves @ imports".
 */

import { describe, expect, it } from "vitest";
import { isDefined } from "@/util";

describe("tsconfig path aliases", () => {
  it("resolves @ imports", () => {
    expect(isDefined("value")).toBe(true);
  });
});
