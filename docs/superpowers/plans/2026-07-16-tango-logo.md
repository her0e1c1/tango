# Tango Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved Stacked T mark and W1-D Card trail logo in the Tango app, PWA assets, and README for Issue #227.

**Architecture:** Treat `public/tango-logo.svg` as the canonical horizontal geometry and keep the dark variant coordinate-identical with color-only differences. The React `Logo` component selects between those public assets with theme visibility classes, while `public/tango-mark.svg` remains the source for square PWA exports.

**Tech Stack:** SVG, React 18, TypeScript, Tailwind CSS 4, Vitest, Testing Library, Quick Look, `sips`, Pillow

---

## File Structure

- Modify `public/tango-mark.svg`: final 64 by 64 Stacked T mark without the decorative dot.
- Create `public/tango-logo.svg`: canonical 216 by 64 W1-D Card trail lockup for light backgrounds.
- Create `public/tango-logo-dark.svg`: geometry-identical dark-background lockup.
- Modify `public/logo192.png`: regenerated 192px mark export.
- Modify `public/logo512.png`: regenerated 512px mark export.
- Modify `public/favicon.ico`: regenerated 64px mark export.
- Modify `src/shared/components/content/Logo.tsx`: render mark-only or theme-selected horizontal assets without changing props or interaction behavior.
- Modify `src/lib/pwaAssets.spec.ts`: lock down final SVG geometry, README references, component behavior, and regenerated asset hashes.
- Modify `README.md`: display the light/dark horizontal logo as the accessible document heading.

No manifest or browser link changes are required because `public/manifest.json` and `index.html` already reference the correct standalone paths.

### Task 1: Lock down and add the scalable logo sources

**Files:**
- Modify: `src/lib/pwaAssets.spec.ts:18-24,212-225`
- Modify: `public/tango-mark.svg`
- Create: `public/tango-logo.svg`
- Create: `public/tango-logo-dark.svg`

- [ ] **Step 1: Write failing SVG contract tests**

Extend the first identity test so the mark rejects the removed decoration:

```ts
expect(mark).not.toContain("<circle");
```

Add a focused test immediately after it:

```ts
it("provides geometry-identical light and dark Card trail logos with outlined lettering", () => {
  const light = readText("public/tango-logo.svg");
  const dark = readText("public/tango-logo-dark.svg");
  const normalizeColors = (source: string) =>
    source.replaceAll("#f8fafc", "SURFACE").replaceAll("#182231", "SURFACE")
      .replaceAll("#202936", "INK").replaceAll("#edf2f7", "INK");

  for (const logo of [light, dark]) {
    expect(logo.trimStart()).toMatch(/^<svg\b/);
    expect(logo).toContain("<title>Tango</title>");
    expect(logo).toMatch(/viewBox=["']0 0 216 64["']/);
    expect(logo).toContain('x="36" y="14" width="176" height="42" rx="8"');
    expect(logo).toContain('x="32" y="8" width="180" height="44" rx="8"');
    expect(logo).toContain('stroke-width="4.5"');
    expect(logo).toContain('stroke-linecap="round"');
    expect(logo).toContain('stroke-linejoin="round"');
    expect(logo).not.toMatch(/<text\b/i);
  }

  expect(light).toContain("#f8fafc");
  expect(light).toContain("#202936");
  expect(dark).toContain("#182231");
  expect(dark).toContain("#edf2f7");
  const darkMark = dark.match(/<g data-logo-part="mark">([\s\S]*?)<\/g>/)?.[1];
  expect(darkMark).toContain("#f8fafc");
  expect(normalizeColors(light)).toBe(normalizeColors(dark));
});
```

- [ ] **Step 2: Run the SVG tests and verify they fail**

Run:

```bash
npx vitest run src/lib/pwaAssets.spec.ts -t "code-native|geometry-identical"
```

Expected: FAIL because the current mark still contains `<circle>` and both horizontal SVG files are missing.

- [ ] **Step 3: Refine the standalone mark**

Replace `public/tango-mark.svg` with the approved geometry:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img">
  <title>Tango</title>
  <rect x="3" y="3" width="58" height="58" rx="17" fill="#4f63b8" />
  <rect x="18" y="14" width="34" height="27" rx="6" fill="#2f7f78" />
  <rect x="12" y="21" width="36" height="28" rx="6" fill="#f8fafc" />
  <path d="M20 28h20v4.5h-7.5V44h-5V32.5H20z" fill="#4f63b8" />
</svg>
```

- [ ] **Step 4: Add the canonical light Card trail SVG**

Create `public/tango-logo.svg` with `viewBox="0 0 216 64"`, `<title>Tango</title>`, the exact layer order and path data from the design spec, and these light colors:

```svg
<rect x="36" y="14" width="176" height="42" rx="8" fill="#2f7f78" />
<rect x="32" y="8" width="180" height="44" rx="8" fill="#f8fafc" />
<g fill="none" stroke="#202936" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M97 25v19 M97 34c0-6-4-10-9-10s-10 4-10 10 4 10 10 10 9-4 9-10" />
  <path d="M112 44V25m0 8c2-6 6-9 11-9 6 0 9 4 9 10v10" />
  <path d="M165 25v17c0 8-4 12-11 12-5 0-9-2-11-5 M165 34c0-6-4-10-10-10s-10 4-10 10 4 10 10 10 10-4 10-10" />
  <path d="M189 24c-7 0-11 4-11 10s4 10 11 10 11-4 11-10-4-10-11-10z" />
</g>
```

Append the same four mark shapes from `tango-mark.svg` last, wrapped in `<g data-logo-part="mark">`, so they cover the Card trail's leading edge.

- [ ] **Step 5: Add the color-only dark variant**

Copy the canonical SVG to `public/tango-logo-dark.svg`. Change only front card `#f8fafc` to `#182231` and lettering `#202936` to `#edf2f7`; do not change coordinates, paths, mark colors, or whitespace.

- [ ] **Step 6: Run the SVG tests and verify they pass**

Run:

```bash
npx vitest run src/lib/pwaAssets.spec.ts -t "code-native|geometry-identical"
```

Expected: PASS for both tests.

- [ ] **Step 7: Commit the scalable assets and tests**

```bash
git add src/lib/pwaAssets.spec.ts public/tango-mark.svg public/tango-logo.svg public/tango-logo-dark.svg
git commit -m "Add Tango logo SVG assets"
```

### Task 2: Integrate the Card trail logo into the app and README

**Files:**
- Modify: `src/lib/pwaAssets.spec.ts:347-379`
- Modify: `src/shared/components/content/Logo.tsx:1-20`
- Modify: `README.md:1`

- [ ] **Step 1: Write failing component and README contract tests**

Replace the normal-logo test expectations with:

```ts
const lightLogo = logo.querySelector('img[src="/tango-logo.svg"]');
const darkLogo = logo.querySelector('img[src="/tango-logo-dark.svg"]');

expect(logo).toHaveClass("contract-class");
expect(lightLogo).toHaveAttribute("alt", "");
expect(lightLogo).toHaveAttribute("aria-hidden", "true");
expect(lightLogo).toHaveAttribute("width", "108");
expect(lightLogo).toHaveAttribute("height", "32");
expect(darkLogo).toHaveAttribute("alt", "");
expect(darkLogo).toHaveAttribute("aria-hidden", "true");
expect(darkLogo).toHaveAttribute("width", "108");
expect(darkLogo).toHaveAttribute("height", "32");
expect(view.getByText("tango")).toHaveClass("sr-only");
```

Keep the click assertion. Extend the mark-only test to assert that `/tango-mark.svg` is present and neither horizontal asset is rendered.

Add this README contract test before the component tests:

```ts
it("displays the light and dark Card trail logo as the README heading", () => {
  const readme = readText("README.md");

  expect(readme).toContain("<h1>");
  expect(readme).toContain('<source media="(prefers-color-scheme: dark)" srcset="./public/tango-logo-dark.svg">');
  expect(readme).toContain('<img src="./public/tango-logo.svg" alt="Tango" width="216" height="64">');
  expect(readme).not.toMatch(/^# Tango$/m);
});
```

- [ ] **Step 2: Run the new integration tests and verify they fail**

Run:

```bash
npx vitest run src/lib/pwaAssets.spec.ts -t "README heading|shared mark|mark-only"
```

Expected: FAIL because the component still renders the mark plus text and README still uses `# Tango`.

- [ ] **Step 3: Implement the theme-selected horizontal logo**

Keep the props and `useButtonInteraction` call. Replace the contents of the root with a conditional:

```tsx
<div {...clickInteraction} className={cx("inline-flex items-center", props.className)}>
  {props.markOnly ? (
    <img src="/tango-mark.svg" alt="" aria-hidden="true" width={32} height={32} className="size-8" />
  ) : (
    <>
      <img
        src="/tango-logo.svg"
        alt=""
        aria-hidden="true"
        width={108}
        height={32}
        className="h-8 w-[108px] dark:hidden"
      />
      <img
        src="/tango-logo-dark.svg"
        alt=""
        aria-hidden="true"
        width={108}
        height={32}
        className="hidden h-8 w-[108px] dark:block"
      />
    </>
  )}
  <span className="sr-only">tango</span>
</div>
```

- [ ] **Step 4: Replace the README heading with the responsive logo**

Replace the first line with:

```html
<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/tango-logo-dark.svg">
    <img src="./public/tango-logo.svg" alt="Tango" width="216" height="64">
  </picture>
</h1>
```

- [ ] **Step 5: Run the integration tests and verify they pass**

Run:

```bash
npx vitest run src/lib/pwaAssets.spec.ts -t "README heading|shared mark|mark-only"
```

Expected: PASS.

- [ ] **Step 6: Run the keyboard accessibility test**

Run:

```bash
npx vitest run src/lib/interactionAccessibility.spec.tsx -t "activates Logo with Enter"
```

Expected: PASS; the component keeps its button interaction contract.

- [ ] **Step 7: Commit the app and README integration**

```bash
git add src/lib/pwaAssets.spec.ts src/shared/components/content/Logo.tsx README.md
git commit -m "Use the Tango logo in the app and README"
```

### Task 3: Regenerate and lock down the PWA exports

**Files:**
- Modify: `public/logo192.png`
- Modify: `public/logo512.png`
- Modify: `public/favicon.ico`
- Modify: `src/lib/pwaAssets.spec.ts:18-22`

- [ ] **Step 1: Render the final SVG to a temporary 512px PNG**

Run outside the sandbox because Quick Look needs macOS service access:

```bash
qlmanage -t -s 512 -o /private/tmp public/tango-mark.svg
```

Expected: `/private/tmp/tango-mark.svg.png` is a 512 by 512 RGBA PNG.

- [ ] **Step 2: Write the 512px and 192px PNG exports**

```bash
cp /private/tmp/tango-mark.svg.png public/logo512.png
sips -z 192 192 /private/tmp/tango-mark.svg.png --out public/logo192.png
sips -g pixelWidth -g pixelHeight public/logo512.png public/logo192.png
```

Expected: `logo512.png` reports 512 by 512 and `logo192.png` reports 192 by 192.

- [ ] **Step 3: Write the 64px single-image ICO export**

```bash
/Users/studio2022/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -c 'from PIL import Image; image=Image.open("/private/tmp/tango-mark.svg.png").convert("RGBA").resize((64,64), Image.Resampling.LANCZOS); image.save("public/favicon.ico", format="ICO", sizes=[(64,64)])'
```

Expected: `file public/favicon.ico` reports one 64 by 64 icon with PNG image data.

- [ ] **Step 4: Run the PWA identity test and verify the regenerated files fail the old hashes**

Run:

```bash
npx vitest run src/lib/pwaAssets.spec.ts
```

Expected: FAIL only on the three `expectedAssetHashes` comparisons because the regenerated files no longer match the old committed hashes. Dimension, structure, manifest, SVG, README, and component assertions should already pass.

- [ ] **Step 5: Update the three expected hashes from the generated files**

Run:

```bash
shasum -a 256 public/favicon.ico public/logo192.png public/logo512.png
```

Replace only the three matching values in `expectedAssetHashes` at the top of `src/lib/pwaAssets.spec.ts`.

- [ ] **Step 6: Run the PWA identity test and verify it passes**

Run:

```bash
npx vitest run src/lib/pwaAssets.spec.ts
```

Expected: all Tango PWA identity tests PASS.

- [ ] **Step 7: Commit the derived assets and hashes**

```bash
git add public/favicon.ico public/logo192.png public/logo512.png src/lib/pwaAssets.spec.ts
git commit -m "Regenerate Tango PWA icons"
```

### Task 4: Verify the final visual and repository contracts

**Files:**
- Verify only; no planned file changes.

- [ ] **Step 1: Render every source and derived format for visual inspection**

```bash
mkdir -p /private/tmp/tango-visual/16 /private/tmp/tango-visual/32 /private/tmp/tango-visual/64 /private/tmp/tango-visual/light /private/tmp/tango-visual/dark /private/tmp/tango-visual/ico
qlmanage -t -s 16 -o /private/tmp/tango-visual/16 public/tango-mark.svg
qlmanage -t -s 32 -o /private/tmp/tango-visual/32 public/tango-mark.svg
qlmanage -t -s 64 -o /private/tmp/tango-visual/64 public/tango-mark.svg
qlmanage -t -s 432 -o /private/tmp/tango-visual/light public/tango-logo.svg
qlmanage -t -s 432 -o /private/tmp/tango-visual/dark public/tango-logo-dark.svg
qlmanage -t -s 64 -o /private/tmp/tango-visual/ico public/favicon.ico
```

Expected: Quick Look produces previews for the standalone mark at 16px, 32px, and 64px, both horizontal SVGs at twice README scale, and the ICO. Also inspect the committed `public/logo192.png` and `public/logo512.png` directly.

- [ ] **Step 2: Build and inspect an explicit light/dark contact sheet**

Use the bundled Pillow runtime to place the 16px, 32px, 64px, 192px, 512px, ICO, light horizontal, and dark horizontal renderings onto labeled `#f7f8fa` and `#111827` panels in `/private/tmp/tango-visual/contact-sheet.png`. Open that file with `view_image`.

Verify that:

- the `T` and two-card overlap remain distinct at 16px, 32px, and 64px;
- the generated 192px and 512px PNGs and 64px ICO match the SVG mark without padding, clipping, blur, or color shifts;
- the W1-D rear card, front card, outlined `ango`, and mark-as-`T` reading are clear on both backgrounds;
- no horizontal geometry or `g` descender is clipped.

- [ ] **Step 3: Run focused tests**

```bash
npx vitest run src/lib/pwaAssets.spec.ts src/lib/interactionAccessibility.spec.tsx
```

Expected: all focused tests PASS.

- [ ] **Step 4: Run the required repository check**

```bash
make check
```

Expected: sample build, formatting check, lint check, and unit tests all PASS.

- [ ] **Step 5: Confirm the final branch scope**

```bash
git status --short
git diff --stat origin/main...HEAD
git log --oneline origin/main..HEAD
```

Expected: clean worktree; only the design/plan, SVG and derived logo assets, Logo component, tests, and README are in scope.

- [ ] **Step 6: Request code review and publish**

Use `@superpowers:requesting-code-review` and resolve any actionable findings. Then use the repository publish workflow to push `codex/issue-227-logo` and create an English PR targeting `main` with `Closes #227`, the compared directions, the W1-D selection rationale, and the exact verification results.
