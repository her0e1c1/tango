# Shared Storybook Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group shared component stories under `Content`, `Feedback`, `Forms`, and `Layout` in the Storybook sidebar.

**Architecture:** Keep Storybook's existing explicit story titles and add the responsibility directory as the middle path segment. Protect the mapping with a filesystem-based Vitest contract that derives the expected Storybook title from each story's directory and filename.

**Tech Stack:** TypeScript, Storybook 10, Vitest 4, Node.js filesystem APIs

## Global Constraints

- Preserve the existing `Shared` Storybook root.
- Use exactly `Content`, `Feedback`, `Forms`, and `Layout` as second-level groups.
- Change only stories under `src/shared/components`; feature stories and component implementations remain unchanged.
- Run `make check` before publishing the pull request.

---

### Task 1: Group Shared Stories by Responsibility

**Files:**
- Create: `src/lib/storybookNavigation.spec.ts`
- Modify: `src/shared/components/content/*.stories.tsx`
- Modify: `src/shared/components/feedback/*.stories.tsx`
- Modify: `src/shared/components/forms/*.stories.tsx`
- Modify: `src/shared/components/layout/*.stories.tsx`
- Test: `src/lib/storybookNavigation.spec.ts`

**Interfaces:**
- Consumes: story metadata with an explicit `title` string in each `*.stories.tsx` default export.
- Produces: Storybook paths in the form `Shared/<Responsibility>/<Component>` and a contract that checks every shared story file.

- [ ] **Step 1: Write the failing Storybook navigation contract**

Create `src/lib/storybookNavigation.spec.ts`:

```ts
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sharedComponentsRoot = path.resolve(process.cwd(), "src/shared/components");
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
```

- [ ] **Step 2: Run the contract to verify it fails**

Run:

```bash
npx vitest run src/lib/storybookNavigation.spec.ts
```

Expected: FAIL in all four generated tests because the current titles omit the responsibility group.

- [ ] **Step 3: Add the responsibility segment to every shared story title**

Apply these exact mappings while leaving all other story metadata and story implementations unchanged:

```text
src/shared/components/content/*.stories.tsx
  Shared/<Component> -> Shared/Content/<Component>

src/shared/components/feedback/*.stories.tsx
  Shared/<Component> -> Shared/Feedback/<Component>

src/shared/components/forms/*.stories.tsx
  Shared/<Component> -> Shared/Forms/<Component>

src/shared/components/layout/*.stories.tsx
  Shared/<Component> -> Shared/Layout/<Component>
```

This covers 9 content stories, 2 feedback stories, 10 forms stories, and 6 layout stories.

- [ ] **Step 4: Run the focused contract to verify it passes**

Run:

```bash
npx vitest run src/lib/storybookNavigation.spec.ts
```

Expected: PASS with 1 test file and 4 tests.

- [ ] **Step 5: Build Storybook**

Run:

```bash
npm run build:storybook
```

Expected: PASS and generate a static Storybook build with no duplicate-title or metadata errors.

- [ ] **Step 6: Run the repository checks**

Run:

```bash
make check
```

Expected: PASS for sample build, formatting, linting, and unit tests.

- [ ] **Step 7: Commit the implementation**

```bash
git add src/lib/storybookNavigation.spec.ts src/shared/components
git commit -m "Group shared stories by responsibility"
```
