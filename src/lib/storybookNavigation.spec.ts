/**
 * @file Verifies the "Storybook navigation" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "groups ${directory} stories
 * under Shared/${storybookGroup}".
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sharedComponentsRoot = path.resolve(process.cwd(), "src/components");
const storyGroups = {
  content: "Content",
  feedback: "Feedback",
  forms: "Forms",
  layout: "Layout",
} as const;

describe("Storybook navigation", () => {
  for (const [directory, storybookGroup] of Object.entries(storyGroups)) {
    it(`groups ${directory} stories under Shared/${storybookGroup}`, () => {
      const groupDirectory = path.join(sharedComponentsRoot, directory);
      const storyFiles = readdirSync(groupDirectory)
        .filter((fileName) => fileName.endsWith(".stories.tsx"))
        .sort();

      const mismatches = storyFiles.flatMap((fileName) => {
        const componentName = fileName.replace(/\.stories\.tsx$/, "");
        const expectedTitle = `Shared/${storybookGroup}/${componentName}`;
        const source = readFileSync(path.join(groupDirectory, fileName), "utf8");
        return source.includes(`title: "${expectedTitle}"`)
          ? []
          : [`${directory}/${fileName}: expected ${expectedTitle}`];
      });

      expect(storyFiles.length).toBeGreaterThan(0);
      expect(mismatches).toEqual([]);
    });
  }
});
