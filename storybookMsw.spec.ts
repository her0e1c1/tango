/** @file Verifies the committed Storybook MSW and route-story integration contract. */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

describe("Storybook MSW integration", () => {
  it("commits the worker and exposes it through Storybook static assets", () => {
    expect(existsSync(path.join(root, "public/mockServiceWorker.js"))).toBe(true);
    expect(read("public/mockServiceWorker.js")).toContain("Mock Service Worker");
    expect(read(".storybook/main.ts")).toContain('staticDirs: ["../public"]');
  });

  it("registers the addon and initializes its CSF3 loader with the shared handlers", () => {
    const main = read(".storybook/main.ts");
    const preview = read(".storybook/preview.ts");

    expect(main).toContain('"msw-storybook-addon"');
    expect(preview).toContain('from "msw-storybook-addon/csf3"');
    expect(preview).toContain("mswLoader(async () =>");
    expect(preview).toContain("setupWorker()");
    expect(preview).toContain("storybookHandlers");
  });

  it("declares the MSW packages and generated worker directory", () => {
    const packageJson = JSON.parse(read("package.json")) as {
      devDependencies?: Record<string, string>;
      msw?: { workerDirectory?: string[] };
    };

    expect(packageJson.devDependencies?.msw).toBeDefined();
    expect(packageJson.devDependencies?.["msw-storybook-addon"]).toBeDefined();
    expect(packageJson.msw?.workerDirectory).toEqual(["public"]);
  });

  it("covers the application route tree with page stories", () => {
    const stories = read("src/page/Page.stories.tsx");

    for (const story of [
      "DeckList",
      "CardList",
      "DeckForm",
      "DeckStart",
      "DeckStudy",
      "CardView",
      "CardForm",
      "Settings",
      "Import",
      "NotFound",
    ]) {
      expect(stories).toContain(`export const ${story}`);
    }
  });
});
