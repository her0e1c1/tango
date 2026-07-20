/**
 * @file Verifies the "Calm Focus visual contract" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "configures the global
 * Storybook review surface", "recognizes raw palette utilities, including directional borders",
 * "loads the Calm Focus stylesheet from the app entry point".
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve(process.cwd(), "src");
const calmFocusStylesheet = "styles/calm-focus.css";
const storybookPreview = readFileSync(path.resolve(process.cwd(), ".storybook/preview.ts"), "utf8");
const layoutStories = readFileSync(path.join(sourceRoot, "components/layout/Layout.stories.tsx"), "utf8");
const utilityRoutePresentationFiles = [
  "features/deck/components/DeckForm.tsx",
  "features/deck/components/templates/DeckFormTemplate.tsx",
  "features/card/components/CardForm.tsx",
  "features/card/components/templates/CardFormTemplate.tsx",
  "features/import/components/templates/DeckImportTemplate.tsx",
  "features/settings/components/ConfigForm.tsx",
  "features/settings/components/SettingsSection.tsx",
  "features/settings/components/templates/ConfigFormTemplate.tsx",
] as const;
const completedUtilityRoutePresentationFiles = [
  "features/deck/components/DeckForm.tsx",
  "features/deck/components/templates/DeckFormTemplate.tsx",
  "features/card/components/CardForm.tsx",
  "features/card/components/templates/CardFormTemplate.tsx",
  "features/import/components/templates/DeckImportTemplate.tsx",
  "features/settings/components/ConfigForm.tsx",
  "features/settings/components/SettingsSection.tsx",
  "features/settings/components/templates/ConfigFormTemplate.tsx",
] as const satisfies readonly (typeof utilityRoutePresentationFiles)[number][];
const completedUtilityRoutePresentationFileSet = new Set<string>(completedUtilityRoutePresentationFiles);
const pendingUtilityRoutePresentationFiles = utilityRoutePresentationFiles.filter(
  (relativePath) => !completedUtilityRoutePresentationFileSet.has(relativePath)
);
const pendingUtilityRoutePresentationFileSet = new Set<string>(pendingUtilityRoutePresentationFiles);
const ownedPresentationFiles = [
  "components/layout/Outer.tsx",
  "components/layout/Main.tsx",
  "components/layout/Layout.tsx",
  "components/layout/Header.tsx",
  "components/layout/List.tsx",
  "components/layout/FullScreen.tsx",
  "components/content/Logo.tsx",
  "components/content/Card.tsx",
  "components/content/Title.tsx",
  "components/content/Section.tsx",
  "components/content/Description.tsx",
  "components/content/Style.tsx",
  "components/content/TagList.tsx",
  "components/content/Score.tsx",
  "components/content/Code.tsx",
  "components/content/Math.tsx",
  "components/feedback/Feedback.tsx",
  "components/feedback/Overlay.tsx",
  "components/forms/Button.tsx",
  "components/forms/Form.tsx",
  "components/forms/FormItem.tsx",
  "components/forms/Input.tsx",
  "components/forms/Select.tsx",
  "components/forms/Textarea.tsx",
  "components/forms/Slider.tsx",
  "components/forms/Switch.tsx",
  "components/forms/Tag.tsx",
  "components/forms/Upload.tsx",
  "features/deck/components/DeckCard.tsx",
  "features/deck/components/DeckStartForm.tsx",
  "features/deck/components/TagFilter.tsx",
  "features/study/components/templates/DeckStartTemplate.tsx",
  "features/deck/components/templates/DeckListTemplate.tsx",
  "features/card/components/Card.tsx",
  "features/card/components/FrontText.tsx",
  "features/card/components/BackText.tsx",
  "features/card/components/CardOverlay.tsx",
  "features/card/components/templates/CardListTemplate.tsx",
  "features/card/components/templates/CardViewTemplate.tsx",
  ...utilityRoutePresentationFiles,
];
const enforcedOwnedPresentationFiles = ownedPresentationFiles.filter(
  (relativePath) => !pendingUtilityRoutePresentationFileSet.has(relativePath)
);
const semanticColorRoles = [
  "canvas",
  "surface",
  "surface-elevated",
  "surface-muted",
  "ink",
  "ink-muted",
  "ink-inverse",
  "accent-primary",
  "accent-secondary",
  "border",
  "focus",
  "success",
  "warning",
  "danger",
  "info",
];
const foundationThemeTokens = [
  "--font-sans",
  "--text-display",
  "--text-title",
  "--text-body",
  "--text-caption",
  "--spacing-shell-gutter",
  "--spacing-section-gap",
  "--spacing-touch",
  "--container-content",
  "--container-reading",
  "--radius-control",
  "--radius-surface",
  "--radius-pill",
  "--shadow-surface",
  "--shadow-elevated",
  "--focus-ring-width",
  "--focus-ring-offset",
  "--transition-duration-fast",
  "--transition-duration-normal",
  "--ease-calm",
];
const rawPaletteUtility =
  /\b(?:accent|bg|border(?:-[xysetrbl])?|caret|decoration|divide|fill|from|outline|placeholder|ring-offset|ring|shadow|stroke|text|to|via)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d{1,3})?\b/g;

/**
 * Provides the source path test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function sourcePath(relativePath: string): string {
  return path.join(sourceRoot, relativePath);
}

/**
 * Reads source needed by the test.
 * File access stays in one helper so assertions work with consistent paths and encoding.
 */
function readSource(relativePath: string): string {
  const absolutePath = sourcePath(relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

/**
 * Reads owned source needed by the test.
 * File access stays in one helper so assertions work with consistent paths and encoding.
 */
function readOwnedSource(relativePath: string): string {
  const absolutePath = sourcePath(relativePath);
  if (!existsSync(absolutePath)) throw new Error(`Owned presentation file is missing: ${relativePath}`);
  return readFileSync(absolutePath, "utf8");
}

/**
 * Provides the css block test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function cssBlock(source: string, selector: string): string {
  const selectorStart = source.indexOf(`${selector} {`);
  if (selectorStart === -1) return "";

  const blockStart = source.indexOf("{", selectorStart);
  if (blockStart === -1) return "";

  const blockEnd = source.indexOf("}", blockStart);
  return blockEnd === -1 ? "" : source.slice(blockStart + 1, blockEnd);
}

/**
 * Provides the custom properties test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function customProperties(source: string): Map<string, string> {
  const properties = new Map<string, string>();
  for (const match of source.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined) properties.set(name, value.trim());
  }
  return properties;
}

/**
 * Provides the raw palette utilities test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function rawPaletteUtilities(source: string): string[] {
  return Array.from(source.matchAll(rawPaletteUtility), (match) => match[0]);
}

describe("Calm Focus visual contract", () => {
  const stylesheet = readSource(calmFocusStylesheet);

  it("configures the global Storybook review surface", () => {
    expect(storybookPreview).toMatch(
      /import\s+\{\s*withThemeByClassName\s*\}\s+from\s+["']@storybook\/addon-themes["'];/
    );
    expect(storybookPreview).toMatch(
      /import\s+\{\s*INITIAL_VIEWPORTS\s*\}\s+from\s+["']\.\.\/src\/storybook\/storybookViewports(?:\.ts)?["'];/
    );
    expect(storybookPreview).toMatch(
      /decorators:\s*\[\s*withThemeByClassName\(\s*\{[\s\S]*themes:\s*\{\s*light:\s*["']light["'],\s*dark:\s*["']dark["'],?\s*\}[\s\S]*defaultTheme:\s*["']light["'][\s\S]*\}\s*\),?\s*\]/
    );
    expect(storybookPreview).toMatch(/viewport:\s*\{\s*options:\s*INITIAL_VIEWPORTS,?\s*\}/);
    expect(layoutStories).toMatch(/parameters:\s*\{\s*layout:\s*["']fullscreen["'],?\s*\}/);
  });

  it("recognizes raw palette utilities, including directional borders", () => {
    const directionalBorders = ["x", "y", "s", "e", "t", "r", "b", "l"].map((direction) =>
      ["border", direction, "red", "500"].join("-")
    );
    const utilities = [["text", "red", "500"].join("-"), ...directionalBorders];

    expect(rawPaletteUtilities(utilities.join(" "))).toEqual(utilities);
  });

  it("loads the Calm Focus stylesheet from the app entry point", () => {
    expect(existsSync(sourcePath(calmFocusStylesheet))).toBe(true);
    expect(readSource("index.css")).toMatch(/@import\s+["']\.\/styles\/calm-focus\.css["'];/);
  });

  it("defines every semantic color role for light and dark modes", () => {
    const lightProperties = customProperties(cssBlock(stylesheet, ":root"));
    const darkProperties = customProperties(cssBlock(stylesheet, ".dark"));

    for (const role of semanticColorRoles) {
      const token = `--calm-color-${role}`;
      expect(lightProperties.get(token), `${token} light value`).toBeDefined();
      expect(darkProperties.get(token), `${token} dark value`).toBeDefined();
    }
  });

  it("maps every semantic color role to a Tailwind theme utility", () => {
    const themeProperties = customProperties(cssBlock(stylesheet, "@theme inline"));

    for (const role of semanticColorRoles) {
      expect(themeProperties.get(`--color-${role}`), role).toBe(`var(--calm-color-${role})`);
    }
  });

  it("exposes the shared foundation tokens through the Tailwind theme", () => {
    const themeProperties = customProperties(cssBlock(stylesheet, "@theme inline"));

    for (const token of foundationThemeTokens) {
      expect(themeProperties.get(token), token).toBeDefined();
    }
  });

  it("maps motion durations to Tailwind transition utilities", () => {
    const themeProperties = customProperties(cssBlock(stylesheet, "@theme inline"));

    expect(themeProperties.get("--transition-duration-fast")).toBe("var(--calm-duration-fast)");
    expect(themeProperties.get("--transition-duration-normal")).toBe("var(--calm-duration-normal)");
  });

  it("sets global canvas, text, and typography defaults", () => {
    const body = cssBlock(stylesheet, "body");

    expect(body).toContain("background-color: var(--calm-color-canvas);");
    expect(body).toContain("color: var(--calm-color-ink);");
    expect(body).toContain("font-family: var(--calm-font-sans);");
    expect(body).toContain("font-size: var(--calm-text-body);");
  });

  it("provides one shared focus-visible ring", () => {
    const focusVisible = cssBlock(stylesheet, ":focus-visible");

    expect(focusVisible).toContain("outline: var(--calm-focus-ring-width) solid var(--calm-color-focus);");
    expect(focusVisible).toContain("outline-offset: var(--calm-focus-ring-offset);");
  });

  it("honors the reduced-motion preference", () => {
    const reducedMotionStart = stylesheet.search(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    const reducedMotion = reducedMotionStart === -1 ? "" : stylesheet.slice(reducedMotionStart);

    expect(reducedMotion).toContain("animation-duration:");
    expect(reducedMotion).toContain("transition-duration:");
    expect(reducedMotion).toContain("scroll-behavior:");
  });

  it("keeps completed owned presentation files free of raw Tailwind palette utilities", () => {
    const violations = enforcedOwnedPresentationFiles.flatMap((relativePath) =>
      rawPaletteUtilities(readOwnedSource(relativePath)).map((utility) => `${relativePath}: ${utility}`)
    );

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("gives the deck filter surfaces semantic Calm Focus treatment", () => {
    expect(readOwnedSource("features/deck/components/DeckStartForm.tsx")).toMatch(/bg-surface/);
    expect(readOwnedSource("features/deck/components/TagFilter.tsx")).toMatch(/bg-surface/);
  });

  it("gives the study start route a focused semantic setup surface", () => {
    const startTemplate = readOwnedSource("features/study/components/templates/DeckStartTemplate.tsx");
    const startForm = readOwnedSource("features/deck/components/DeckStartForm.tsx");
    const tagFilter = readOwnedSource("features/deck/components/TagFilter.tsx");

    expect(startTemplate).toMatch(/max-w-reading/);
    expect(startTemplate).toMatch(/text-display/);
    expect(startTemplate).toMatch(/bg-surface/);
    expect(startForm).toMatch(/<section/);
    expect(tagFilter).toMatch(/<section/);
  });

  it("gives the card editing surfaces semantic Calm Focus treatment", () => {
    expect(readOwnedSource("features/card/components/CardForm.tsx")).toMatch(/bg-surface-muted/);
    expect(readOwnedSource("features/card/components/templates/CardFormTemplate.tsx")).toMatch(/bg-surface/);
  });

  it("gives the import route a bounded semantic Calm Focus surface", () => {
    const importTemplate = readOwnedSource("features/import/components/templates/DeckImportTemplate.tsx");

    expect(importTemplate).toMatch(/max-w-reading/);
    expect(importTemplate).toMatch(/border-border/);
    expect(importTemplate).toMatch(/bg-surface/);
  });

  it("gives Settings semantic sections within a bounded Calm Focus surface", () => {
    const settingsSection = readOwnedSource("features/settings/components/SettingsSection.tsx");
    const configTemplate = readOwnedSource("features/settings/components/templates/ConfigFormTemplate.tsx");

    expect(settingsSection).toMatch(/<section/);
    expect(settingsSection).toMatch(/border-border/);
    expect(settingsSection).toMatch(/bg-surface/);
    expect(settingsSection).toMatch(/shadow-surface/);
    expect(configTemplate).toMatch(/max-w-reading/);
    expect(configTemplate).toMatch(/text-title/);
    expect(configTemplate).not.toMatch(/rounded-surface/);
  });

  it("registers utility routes and enforces semantic surfaces for completed templates", () => {
    expect(utilityRoutePresentationFiles).toEqual([
      "features/deck/components/DeckForm.tsx",
      "features/deck/components/templates/DeckFormTemplate.tsx",
      "features/card/components/CardForm.tsx",
      "features/card/components/templates/CardFormTemplate.tsx",
      "features/import/components/templates/DeckImportTemplate.tsx",
      "features/settings/components/ConfigForm.tsx",
      "features/settings/components/SettingsSection.tsx",
      "features/settings/components/templates/ConfigFormTemplate.tsx",
    ]);
    expect(ownedPresentationFiles).toEqual(expect.arrayContaining([...utilityRoutePresentationFiles]));
    expect(pendingUtilityRoutePresentationFiles).toEqual([]);
    expect(enforcedOwnedPresentationFiles).toEqual(expect.arrayContaining([...completedUtilityRoutePresentationFiles]));
    for (const relativePath of pendingUtilityRoutePresentationFiles) {
      expect(enforcedOwnedPresentationFiles).not.toContain(relativePath);
    }

    for (const relativePath of completedUtilityRoutePresentationFiles.filter(
      (file) => file.includes("Template") && !file.includes("ConfigFormTemplate")
    )) {
      expect(readOwnedSource(relativePath), relativePath).toMatch(/bg-surface(?:-elevated)?/);
    }
  });
});
