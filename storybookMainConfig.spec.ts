import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const storybookMain = readFileSync(
  path.resolve(".storybook/main.ts"),
  "utf8",
);
const nodeTsconfig = JSON.parse(
  readFileSync(path.resolve("tsconfig.node.json"), "utf8"),
) as {
  compilerOptions?: {
    allowImportingTsExtensions?: boolean;
  };
};

describe("Storybook main configuration", () => {
  it("uses an explicit TypeScript extension for local imports", () => {
    expect(storybookMain).toContain('from "./vitePlugins.ts"');
  });

  it("allows TypeScript extensions in Node configuration imports", () => {
    expect(nodeTsconfig.compilerOptions?.allowImportingTsExtensions).toBe(true);
  });
});
