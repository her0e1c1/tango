# Settings Page Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the settings page's mixed section styles with an accessible, responsive unified list while preserving all existing settings and auto-save behavior.

**Architecture:** Keep state ownership in `ConfigContainer` and `useConfigFormState`. Add minimal label-related props to shared `Switch` and `Slider`, add settings-specific section/row presentation components, and rebuild `ConfigForm` as four groups: Account, Appearance, Study, and a collapsed Advanced group.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, React Hook Form, React Icons, Vitest, Testing Library, Storybook 10.

## Global Constraints

- Preserve all 10 settings, storage keys, defaults, authentication actions, and auto-save behavior.
- Use existing Calm Focus color, spacing, radius, shadow, focus, and motion tokens.
- Keep the layout single-column on desktop and mobile with touch targets of at least 44px.
- Keep GitHub Access Token value, callback, and input type unchanged.
- Do not change pages outside settings except for minimal backwards-compatible accessibility props on shared controls.
- Run `make check` before completing non-documentation changes.

---

### Task 1: Accessible shared selection control props

**Files:**
- Modify: `src/shared/components/forms/Switch.tsx`
- Modify: `src/shared/components/forms/Slider.tsx`
- Test: `src/shared/components/forms/SelectionControl.spec.tsx`

**Interfaces:**
- Produces: `Switch` and `Slider` props `id?: string`, `aria-label?: string`, and `aria-describedby?: string`.
- Produces: `Slider` prop `aria-valuetext?: string`.
- Preserves: current controlled values, refs, handlers, touch targets, and disabled presentation.

- [ ] **Step 1: Write failing accessibility passthrough tests**

Add tests that render the controls with explicit accessible props and assert the native inputs receive them:

```tsx
it("forwards accessible naming props to the switch input", () => {
  render(<Switch id="dark-mode" aria-label="Dark mode" aria-describedby="dark-mode-description" />);

  expect(screen.getByRole("checkbox", { name: "Dark mode" })).toHaveAttribute("id", "dark-mode");
  expect(screen.getByRole("checkbox")).toHaveAttribute("aria-describedby", "dark-mode-description");
});

it("forwards accessible naming and value text to the slider input", () => {
  render(
    <Slider
      id="autoplay-interval"
      aria-label="Autoplay interval"
      aria-describedby="autoplay-interval-description"
      aria-valuetext="7 seconds"
      min={0}
      max={60}
      value="7"
    />
  );

  const slider = screen.getByRole("slider", { name: "Autoplay interval" });
  expect(slider).toHaveAttribute("id", "autoplay-interval");
  expect(slider).toHaveAttribute("aria-describedby", "autoplay-interval-description");
  expect(slider).toHaveAttribute("aria-valuetext", "7 seconds");
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npx vitest run src/shared/components/forms/SelectionControl.spec.tsx`

Expected: FAIL because the native inputs do not yet receive the new props.

- [ ] **Step 3: Add the minimal backwards-compatible props**

Extend each component's prop type and destructuring, then pass the values to the native input:

```tsx
id={id}
aria-label={ariaLabel}
aria-describedby={ariaDescribedBy}
```

For `Slider`, also pass:

```tsx
aria-valuetext={ariaValueText}
```

Use camel-cased destructuring aliases for hyphenated ARIA props:

```tsx
"aria-label"?: string;
"aria-describedby"?: string;
"aria-valuetext"?: string;
```

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `npx vitest run src/shared/components/forms/SelectionControl.spec.tsx`

Expected: all selection control tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/forms/Switch.tsx src/shared/components/forms/Slider.tsx src/shared/components/forms/SelectionControl.spec.tsx
git commit -m "Improve selection control accessibility"
```

---

### Task 2: Settings-specific section and row presentation

**Files:**
- Create: `src/features/settings/components/SettingsSection.tsx`
- Create: `src/features/settings/components/SettingsSection.spec.tsx`

**Interfaces:**
- Produces: `SettingsSection({ title, description, icon, children })`.
- Produces: `SettingsRow({ inputId, label, description, children })`.
- Depends on: Calm Focus Tailwind tokens and React's `useId`.

- [ ] **Step 1: Write failing semantic presentation tests**

Create tests for a section heading relationship, decorative icon, label relationship, description ID, and touch-friendly row:

```tsx
it("relates a settings section to its unique heading", () => {
  render(
    <SettingsSection title="Appearance" description="Navigation and visual feedback" icon={<span>icon</span>}>
      <div>content</div>
    </SettingsSection>
  );

  const heading = screen.getByRole("heading", { level: 2, name: "Appearance" });
  expect(heading.closest("section")).toHaveAttribute("aria-labelledby", heading.id);
  expect(screen.getByText("icon").parentElement).toHaveAttribute("aria-hidden", "true");
});

it("relates a settings row label and description to its input id", () => {
  render(
    <SettingsRow inputId="dark-mode" label="Dark mode" description="Use the darker Calm Focus palette">
      <input id="dark-mode" aria-describedby="dark-mode-description" />
    </SettingsRow>
  );

  expect(screen.getByText("Dark mode")).toHaveAttribute("for", "dark-mode");
  expect(screen.getByText("Use the darker Calm Focus palette")).toHaveAttribute("id", "dark-mode-description");
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npx vitest run src/features/settings/components/SettingsSection.spec.tsx`

Expected: FAIL because `SettingsSection.tsx` does not exist.

- [ ] **Step 3: Implement the presentation components**

Use these public types:

```tsx
export interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export interface SettingsRowProps {
  inputId: string;
  label: string;
  description: string;
  children: React.ReactNode;
}
```

`SettingsSection` renders a semantic section with `rounded-surface border border-border bg-surface shadow-surface`, a generated heading ID, an `aria-hidden` icon wrapper, and a divided children container. `SettingsRow` renders a `min-h-touch` responsive flex row, a `label htmlFor={inputId}`, a description with `${inputId}-description`, and a non-shrinking control region.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `npx vitest run src/features/settings/components/SettingsSection.spec.tsx`

Expected: both semantic presentation tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/components/SettingsSection.tsx src/features/settings/components/SettingsSection.spec.tsx
git commit -m "Add settings presentation primitives"
```

---

### Task 3: Rebuild ConfigForm as the unified settings list

**Files:**
- Modify: `src/features/settings/components/ConfigForm.tsx`
- Modify: `src/features/settings/components/ConfigForm.spec.tsx`

**Interfaces:**
- Consumes: `SettingsSection` and `SettingsRow` from Task 2.
- Consumes: accessible `Switch` and `Slider` props from Task 1.
- Preserves: `ConfigFormProps` and `ConfigFormFields` public interfaces.
- Produces: Account, Appearance, Study, and collapsed Advanced groups.

- [ ] **Step 1: Replace legacy structure expectations with failing unified-list tests**

Update the tests to assert:

```tsx
for (const name of ["Account", "Appearance", "Study", "Advanced"]) {
  expect(view.getByRole("heading", { level: 2, name })).toBeInTheDocument();
}
expect(view.queryByRole("heading", { level: 2, name: "Layout" })).not.toBeInTheDocument();
expect(view.queryByRole("heading", { level: 2, name: "Autoplay" })).not.toBeInTheDocument();
```

Add accessible input assertions:

```tsx
expect(view.getByRole("checkbox", { name: "Show header" })).toBeChecked();
expect(view.getByRole("checkbox", { name: "Use card interval" })).toBeChecked();
expect(view.getByRole("slider", { name: "Maximum cards" })).toHaveValue("24");
expect(view.getByRole("slider", { name: "Autoplay interval" })).toHaveAttribute("aria-valuetext", "7 seconds");
```

Add Advanced behavior assertions:

```tsx
const details = view.getByText("Advanced").closest("details");
expect(details).not.toHaveAttribute("open");
expect(details).toContainElement(view.getByDisplayValue("github-token"));
expect(details).toHaveTextContent("1.2.3");
expect(details).toHaveTextContent("user-123");
```

Retain the existing callback and login/logout tests.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npx vitest run src/features/settings/components/ConfigForm.spec.tsx`

Expected: FAIL because the current form still exposes Layout, Autoplay, Metadata, and unnamed native controls.

- [ ] **Step 3: Implement the unified list**

Use one `useId()` prefix for control IDs. Render:

- `SettingsSection` Account with a responsive identity row and Login/Logout button.
- `SettingsSection` Appearance with four `SettingsRow` controls.
- `SettingsSection` Study with five `SettingsRow` controls, including visible value badges beside each Slider.
- A styled native `details` Advanced group with a `summary` containing an `h2`, then Version, GitHub Access Token, and User ID content.

Use these exact labels:

```ts
"Show header"
"Show study buttons"
"Show swipe feedback"
"Dark mode"
"Shuffle cards"
"Maximum cards"
"Use card interval"
"Start autoplay"
"Autoplay interval"
```

Pass `${inputId}-description` through `aria-describedby`. Pass `${cardInterval} seconds` through the interval slider's `aria-valuetext`. Keep the GitHub token `Input` props unchanged.

- [ ] **Step 4: Run focused settings tests and verify GREEN**

Run: `npx vitest run src/features/settings/components/ConfigForm.spec.tsx src/features/settings/hooks/useConfigFormState.spec.tsx`

Expected: all ConfigForm and form state tests pass, including existing auto-save behavior.

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/components/ConfigForm.tsx src/features/settings/components/ConfigForm.spec.tsx
git commit -m "Modernize the settings form layout"
```

---

### Task 4: Modernize the page shell and Storybook coverage

**Files:**
- Modify: `src/features/settings/components/templates/ConfigFormTemplate.tsx`
- Modify: `src/features/settings/components/templates/ConfigFormTemplate.spec.tsx`
- Review: `src/features/settings/components/ConfigForm.stories.tsx`
- Review: `src/features/settings/components/templates/ConfigFormTemplate.stories.tsx`

**Interfaces:**
- Preserves: `ConfigFormTemplateProps` and all existing Storybook fixture shapes.
- Produces: one title-scale page heading, auto-save helper copy, and no redundant nested surface.

- [ ] **Step 1: Write the failing template expectations**

Change the template test to require:

```tsx
const heading = view.getByRole("heading", { level: 1, name: "Settings" });
const shell = heading.parentElement;

expect(shell).toHaveClass("mx-auto", "w-full", "max-w-reading");
expect(shell).not.toHaveClass("rounded-surface", "border", "bg-surface");
expect(heading).toHaveClass("text-title");
expect(view.getByText("Changes are saved automatically")).toHaveClass("text-ink-muted");
expect(shell).toContainElement(view.getByRole("heading", { level: 2, name: "Account" }).closest("section"));
```

- [ ] **Step 2: Run the template test and verify RED**

Run: `npx vitest run src/features/settings/components/templates/ConfigFormTemplate.spec.tsx`

Expected: FAIL because the existing template still uses the redundant bordered surface and display heading.

- [ ] **Step 3: Implement the simplified template and update stories**

Render a `max-w-reading` section containing a header row and `ConfigForm`:

```tsx
<section className="mx-auto flex w-full max-w-reading flex-col gap-4">
  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
    <h1 className="break-words text-title font-bold text-ink">Settings</h1>
    <p className="text-caption text-ink-muted">Changes are saved automatically</p>
  </div>
  {props.configForm != null && <ConfigForm {...props.configForm} />}
</section>
```

Review the existing LoggedOut, LoggedIn, LongContent, Dark, and Mobile stories. Their props already cover the required states and the component changes automatically apply the new presentation, so leave the story source unchanged. Do not add state or dependencies solely to force native `details` open.

- [ ] **Step 4: Run settings and Storybook verification**

Run:

```bash
npx vitest run src/features/settings src/shared/components/forms/SelectionControl.spec.tsx
npm run build:storybook
```

Expected: all focused tests pass and Storybook exits successfully.

- [ ] **Step 5: Run repository-required verification**

Run: `make check`

Expected: format, lint, sample build, and unit tests pass. If infrastructure blocks Docker or dependency access, rerun with the repository-approved environment and report the exact remaining failure without hiding it.

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/components/templates/ConfigFormTemplate.tsx src/features/settings/components/templates/ConfigFormTemplate.spec.tsx
git commit -m "Refine the settings page presentation"
```

---

### Task 5: Final review and PR update

**Files:**
- Review: all files changed by Tasks 1-4
- Review: `docs/superpowers/specs/2026-07-18-settings-page-modernization-design.md`

**Interfaces:**
- Verifies: implementation matches the approved spec without changing state or persistence contracts.

- [ ] **Step 1: Inspect the complete branch diff**

Run:

```bash
git status --short
git diff origin/main...HEAD --check
git diff origin/main...HEAD --stat
```

Expected: clean worktree, no whitespace errors, and only the approved settings, shared-control accessibility, plan, and design files.

- [ ] **Step 2: Push the implementation commits**

Run: `git push`

Expected: `origin/codex/settings-page-modernization` advances and PR #303 updates.
