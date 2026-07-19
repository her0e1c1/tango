import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import storybookConfig from "./.storybook/main";
import vitestConfig from "./vitest.config";

interface PackageJson {
  scripts: Record<string, string>;
}

interface TestProject {
  test?: {
    name?: string;
    environment?: string;
    browser?: {
      enabled?: boolean;
      headless?: boolean;
      screenshotFailures?: boolean;
      screenshotDirectory?: string;
      instances?: Array<{ browser: string }>;
    };
  };
}

const packageJson = JSON.parse(
  readFileSync(path.resolve("package.json"), "utf8"),
) as PackageJson;
const projects = (vitestConfig.test?.projects ?? []) as TestProject[];
const projectNamed = (name: string) =>
  projects.find((project) => project.test?.name === name);

describe("Storybook Vitest integration", () => {
  it("registers the addon and a dedicated command", () => {
    expect(storybookConfig.addons).toContain("@storybook/addon-vitest");
    expect(packageJson.scripts["test:storybook"]).toBe(
      "vitest run --project=storybook",
    );
  });

  it("keeps unit and Chromium Storybook tests isolated", () => {
    expect(projectNamed("unit")?.test?.environment).toBe("jsdom");
    expect(projectNamed("storybook")?.test?.browser).toMatchObject({
      enabled: true,
      headless: true,
      screenshotFailures: true,
      screenshotDirectory: "test-results/storybook",
      instances: [{ browser: "chromium" }],
    });
  });
});
