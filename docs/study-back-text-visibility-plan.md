# Study Back Text Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep revealed study back text readable by preventing edge swipe overlays from adding full-viewport backdrops.

**Architecture:** Correct the shared `Overlay` position contract instead of special-casing the study template. Center overlays retain their existing backdrop, while left, right, top, and bottom overlays retain their positioning and interactions without the backdrop pseudo-element.

**Tech Stack:** React 19, TypeScript, classnames, Tailwind CSS 4, Vitest, Testing Library, Storybook

## Global Constraints

- Preserve the public `Overlay` props and all existing position values.
- Keep the center-overlay backdrop unchanged.
- Keep edge-overlay dimensions, positioning, focus, accessibility, and click behavior unchanged.
- Do not change study state, swipe actions, card data, routing, persistence, or remote writes.
- Keep comments and commit messages in English.
- Do not commit ignored files.
- Run `make check` before finishing.

---

### Task 1: Restrict the overlay backdrop to center content

**Files:**
- Modify: `src/components/feedback/Overlay.spec.tsx`
- Modify: `src/components/feedback/Overlay.tsx`

**Interfaces:**
- Consumes: `Overlay`'s existing `position: "left" | "right" | "top" | "bottom" | "center"` prop.
- Produces: a class contract where only `position="center"` includes `before:bg-canvas/70` and its fixed pseudo-element classes.

- [ ] **Step 1: Write the failing edge-overlay regression assertion**

Update the existing position-contract test to retain its position checks and reject the full-screen backdrop on every edge:

```tsx
it.each([
  ["left", "inset-y-0", "left-0"],
  ["right", "inset-y-0", "right-0"],
  ["top", "inset-x-0", "top-0"],
  ["bottom", "inset-x-0", "bottom-0"],
] as const)("retains the %s position contract", (position, insetClass, edgeClass) => {
  render(<Overlay position={position}>Overlay</Overlay>);
  const overlay = screen.getByText("Overlay");

  expect(overlay).toHaveClass(insetClass, edgeClass);
  expect(overlay).not.toHaveClass("before:bg-canvas/70");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/components/feedback/Overlay.spec.tsx
```

Expected: FAIL for the left, right, top, and bottom cases because each edge currently includes `before:bg-canvas/70`.

- [ ] **Step 3: Apply the minimal class-composition fix**

Keep the shared surface and focus classes unchanged, and make the backdrop conditional:

```tsx
className={cx(
  "absolute z-10 max-h-full max-w-full overflow-x-hidden overflow-y-auto rounded-control bg-surface-elevated text-ink shadow-elevated",
  props.position === "center" &&
    "before:pointer-events-none before:fixed before:inset-0 before:-z-10 before:bg-canvas/70",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
  ["left", "right"].includes(props.position) && "w-20",
  ["top", "bottom"].includes(props.position) && "h-10",
  props.position === "center" && "inset-0",
  props.position === "left" && "inset-y-0 left-0",
  props.position === "right" && "inset-y-0 right-0",
  props.position === "top" && "inset-x-0 top-0",
  props.position === "bottom" && "inset-x-0 bottom-0",
  props.className
)}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/components/feedback/Overlay.spec.tsx
```

Expected: all six `Overlay` tests PASS.

- [ ] **Step 5: Run repository verification**

Run:

```bash
make check
```

Expected: sample build, formatting, lint, TypeScript checks, and unit tests all exit successfully.

- [ ] **Step 6: Verify the study back view visually**

Start Storybook:

```bash
npm run storybook -- --host 127.0.0.1 --port 6006
```

Open the `Study/DeckSwiperTemplate` `BackTextCode` story. Confirm that the back text is readable and that the four edge swipe controls remain present. Also open the `Shared/Feedback/Overlay` `Center` story and confirm that the center backdrop remains present.

- [ ] **Step 7: Commit the implementation**

```bash
git add src/components/feedback/Overlay.spec.tsx src/components/feedback/Overlay.tsx
git commit -m "Fix study back text visibility"
```
