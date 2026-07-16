import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve(process.cwd(), "src");
const calmFocusStylesheet = "shared/styles/calm-focus.css";
const storybookPreview = readFileSync(path.resolve(process.cwd(), ".storybook/preview.ts"), "utf8");
const layoutStories = readFileSync(path.join(sourceRoot, "shared/components/layout/Layout.stories.tsx"), "utf8");
const ownedPresentationFiles = [
  "shared/components/layout/Outer.tsx",
  "shared/components/layout/Main.tsx",
  "shared/components/layout/Layout.tsx",
  "shared/components/layout/Header.tsx",
  "shared/components/layout/List.tsx",
  "shared/components/layout/FullScreen.tsx",
  "shared/components/content/Logo.tsx",
  "shared/components/content/Card.tsx",
  "shared/components/content/Title.tsx",
  "shared/components/content/Section.tsx",
  "shared/components/content/Description.tsx",
  "shared/components/content/Style.tsx",
  "shared/components/content/TagList.tsx",
  "shared/components/content/Score.tsx",
  "shared/components/content/Code.tsx",
  "shared/components/content/Math.tsx",
  "shared/components/feedback/Feedback.tsx",
  "shared/components/feedback/Overlay.tsx",
  "shared/components/forms/Button.tsx",
  "shared/components/forms/Form.tsx",
  "shared/components/forms/FormItem.tsx",
  "shared/components/forms/Input.tsx",
  "shared/components/forms/Select.tsx",
  "shared/components/forms/Textarea.tsx",
  "shared/components/forms/Slider.tsx",
  "shared/components/forms/Switch.tsx",
  "shared/components/forms/Tag.tsx",
  "shared/components/forms/Upload.tsx",
  "features/deck/components/DeckCard.tsx",
  "features/deck/components/DeckStartForm.tsx",
  "features/deck/components/TagFilter.tsx",
  "features/deck/components/templates/DeckListTemplate.tsx",
  "features/card/components/Card.tsx",
  "features/card/components/FrontText.tsx",
  "features/card/components/BackText.tsx",
  "features/card/components/CardOverlay.tsx",
  "features/card/components/templates/CardListTemplate.tsx",
  "features/card/components/templates/CardViewTemplate.tsx",
];
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

function sourcePath(relativePath: string): string {
  return path.join(sourceRoot, relativePath);
}

function readSource(relativePath: string): string {
  const absolutePath = sourcePath(relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

function readOwnedSource(relativePath: string): string {
  const absolutePath = sourcePath(relativePath);
  if (!existsSync(absolutePath)) throw new Error(`Owned presentation file is missing: ${relativePath}`);
  return readFileSync(absolutePath, "utf8");
}

function cssBlock(source: string, selector: string): string {
  const selectorStart = source.indexOf(`${selector} {`);
  if (selectorStart === -1) return "";

  const blockStart = source.indexOf("{", selectorStart);
  if (blockStart === -1) return "";

  const blockEnd = source.indexOf("}", blockStart);
  return blockEnd === -1 ? "" : source.slice(blockStart + 1, blockEnd);
}

function customProperties(source: string): Map<string, string> {
  const properties = new Map<string, string>();
  for (const match of source.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined) properties.set(name, value.trim());
  }
  return properties;
}

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
      /import\s+\{\s*INITIAL_VIEWPORTS\s*\}\s+from\s+["']\.\.\/src\/shared\/storybook\/storybookViewports(?:\.ts)?["'];/
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
    expect(readSource("index.css")).toMatch(/@import\s+["']\.\/shared\/styles\/calm-focus\.css["'];/);
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

  it("keeps the owned presentation files free of raw Tailwind palette utilities", () => {
    const violations = ownedPresentationFiles.flatMap((relativePath) =>
      rawPaletteUtilities(readOwnedSource(relativePath)).map((utility) => `${relativePath}: ${utility}`)
    );

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("gives the deck filter surfaces semantic Calm Focus treatment", () => {
    expect(readOwnedSource("features/deck/components/DeckStartForm.tsx")).toMatch(/bg-surface/);
    expect(readOwnedSource("features/deck/components/TagFilter.tsx")).toMatch(/bg-surface/);
  });
});
