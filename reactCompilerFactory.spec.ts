import { describe, expect, it } from "vitest";
import { createReactCompilerPlugin } from "./reactCompiler";

describe("createReactCompilerPlugin", () => {
  it("returns a fresh resolved plugin for every call", async () => {
    const [firstPlugin, secondPlugin] = await Promise.all([
      createReactCompilerPlugin(),
      createReactCompilerPlugin(),
    ]);

    expect(firstPlugin).not.toBe(secondPlugin);
  });
});
