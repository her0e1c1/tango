import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import type { A11yParameters } from "@storybook/addon-a11y";
import type { PreviewWeb } from "storybook/preview-api";
import type { StoryIndex, WebRenderer } from "storybook/internal/types";
import type { RunOptions } from "axe-core";

const index = JSON.parse(readFileSync(resolve("storybook-static/index.json"), "utf8")) as StoryIndex;
const stories = Object.values(index.entries).filter(
  (entry) => entry.type === "story" && entry.importPath.startsWith("./src/") && entry.tags?.includes("test")
);
if (stories.length === 0) throw new Error("The built Storybook index contains no testable source stories");

type StorybookWindow = Window & { __STORYBOOK_PREVIEW__?: PreviewWeb<WebRenderer> };
interface Metadata {
  a11y: A11yParameters;
  manual: boolean;
  viewport?: { width: number; height: number };
}

function scopedScan(page: Page, context: A11yParameters["context"]) {
  const scan = new AxeBuilder({ page });
  const contextual = typeof context === "object" && !Array.isArray(context) ? context : undefined;
  const includes =
    contextual && "include" in contextual ? contextual.include : contextual ? "body" : (context ?? "body");
  const excludes = contextual && "exclude" in contextual ? contextual.exclude : undefined;
  // The current CSF configuration uses CSS selectors; reject unsupported contexts instead of narrowing the scan.
  expect(typeof includes === "string" || Array.isArray(includes)).toBe(true);
  if (typeof includes === "string") scan.include(includes);
  else for (const selector of includes as string[]) scan.include(selector);
  for (const selector of [".sb-wrapper", "#storybook-docs", "#storybook-highlights-root"]) scan.exclude(selector);
  if (typeof excludes === "string") scan.exclude(excludes);
  else if (excludes) for (const selector of excludes as string[]) scan.exclude(selector);
  return scan;
}

for (const story of stories) {
  test(`PLAYWRIGHT-ACCESSIBILITY-01 ${story.id}`, async ({ page, baseURL }) => {
    const browserErrors: string[] = [];
    const external: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    if (baseURL === undefined) throw new Error("The visual fixture base URL is missing");
    const origin = new URL(baseURL).origin.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    await page.route(new RegExp(`^(?!${origin}(?:/|$))https?://`, "u"), async (route) => {
      external.push(route.request().url());
      await route.abort();
    });
    let metadata: Metadata;
    await test.step("Given: the indexed visual fixture with its resolved project and story parameters", async () => {
      await page.goto(`/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`);
      await page.waitForFunction((id) => {
        const preview = (window as StorybookWindow).__STORYBOOK_PREVIEW__;
        return preview?.storyRenders.some(
          (render) => render.id === id && (render.phase === "finished" || render.phase === "errored")
        );
      }, story.id);
      metadata = await page.evaluate(async (id) => {
        const preview = (window as StorybookWindow).__STORYBOOK_PREVIEW__;
        if (!preview) throw new Error("Storybook preview was not initialized");
        await preview.ready();
        const render = preview.storyRenders.find((value) => value.id === id);
        if (render?.phase !== "finished") throw new Error(`Visual fixture failed to render: ${id}`);
        const prepared = await preview.storyStore.loadStory({ storyId: id });
        const context = preview.storyStore.getStoryContext(prepared);
        const selected = context.globals.viewport as { value?: string; isRotated?: boolean } | undefined;
        const options = context.parameters.viewport?.options as
          | Record<string, { styles: { width: string; height: string } }>
          | undefined;
        const size = selected?.value ? options?.[selected.value]?.styles : undefined;
        const width = Number.parseInt(size?.width ?? "", 10);
        const height = Number.parseInt(size?.height ?? "", 10);
        return {
          a11y: (context.parameters.a11y ?? {}) as A11yParameters,
          manual: context.globals.a11y?.manual === true,
          ...(Number.isFinite(width) && Number.isFinite(height)
            ? { viewport: selected?.isRotated ? { width: height, height: width } : { width, height } }
            : {}),
        };
      }, story.id);
      if (metadata.viewport) await page.setViewportSize(metadata.viewport);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      expect(browserErrors).toEqual([]);
      expect(external).toEqual([]);
    });
    const results =
      await test.step("When: axe scans the completed visual fixture with its declared rule exceptions", async () => {
        const { a11y, manual } = metadata;
        // These flags would have disabled the previous automatic check; keep them explicit and reviewable.
        expect({ disabled: a11y.disable === true, off: a11y.test === "off", manual }).toEqual({
          disabled: false,
          off: false,
          manual: false,
        });
        expect(Object.keys(a11y.config ?? {}).filter((key) => key !== "rules")).toEqual([]);
        const rules: NonNullable<RunOptions["rules"]> = { region: { enabled: false } };
        for (const rule of a11y.config?.rules ?? []) {
          expect(Object.keys(rule).filter((key) => key !== "id" && key !== "enabled")).toEqual([]);
          if (rule.id && typeof rule.enabled === "boolean") rules[rule.id] = { enabled: rule.enabled };
        }
        const scan = scopedScan(page, a11y.context).options({
          ...a11y.options,
          rules: { ...rules, ...a11y.options?.rules },
        });
        return scan.analyze();
      });
    await test.step("Then: no accessibility violations or browser failures are present", async () => {
      expect(results.violations).toEqual([]);
      expect(browserErrors).toEqual([]);
      expect(external).toEqual([]);
    });
  });
}
