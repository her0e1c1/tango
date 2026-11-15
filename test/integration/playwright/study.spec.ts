import type { Locator, Page } from "@playwright/test";
import { test, expect, open, readEvents } from "./fixtures";

async function widget(page: Page, variant: string, params?: Record<string, string>) {
  await open(page, "study", `widget-${variant}`, params);
}
async function calls(page: Page, name: string) {
  return (await readEvents(page)).filter((event) => event.name === name);
}
async function touch(target: Locator, x: number, y: number) {
  await target.evaluate(
    (element, end) => {
      const start = new Touch({ identifier: 1, target: element, clientX: 200, clientY: 200 });
      const finish = new Touch({ identifier: 1, target: element, clientX: end.x, clientY: end.y });
      element.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [start] }));
      element.dispatchEvent(new TouchEvent("touchmove", { bubbles: true, touches: [finish] }));
      element.dispatchEvent(new TouchEvent("touchend", { bubbles: true, changedTouches: [finish] }));
    },
    { x, y }
  );
}
async function mouse(target: Locator, button = 0, x = 200, y = 40) {
  await target.evaluate(
    (element, { button, x, y }) => {
      element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button, clientX: 200, clientY: 200 }));
      document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, button, clientX: x, clientY: y }));
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button, clientX: x, clientY: y }));
      element.dispatchEvent(new MouseEvent("click", { bubbles: true, button }));
    },
    { button, x, y }
  );
}

for (const variant of [
  "default",
  "swipe-hidden",
  "playback-hidden",
  "details-hidden",
  "controls-hidden",
  "playback-unavailable",
  "mobile",
  "safe-area",
  "deck-view",
]) {
  test(`PLAYWRIGHT-CARD-PLAYER-24 centers the front with ${variant}`, async ({ page }) => {
    await test.step("Given: prepared player and viewport", async () => {
      if (["mobile", "safe-area"].includes(variant)) await page.setViewportSize({ width: 375, height: 812 });
      await widget(page, variant);
    });
    await test.step("When: render the front and safe area", async () => {
      if (variant === "safe-area")
        await page.locator("[style*='--study-safe-area-top']").evaluate((element: HTMLElement) => {
          element.style.setProperty("--study-safe-area-top", "47px");
          element.style.setProperty("--study-safe-area-bottom", "34px");
        });
    });
    await test.step("Then: the prompt remains centered", async () => {
      await expect
        .poll(() =>
          page.locator("#frontText > *").evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return Math.abs(rect.top + rect.height / 2 - innerHeight / 2);
          })
        )
        .toBeCloseTo(variant === "safe-area" ? 6.5 : 0, 0);
      if (variant === "deck-view") {
        await expect(page.getByRole("button", { name: "Swipe up", exact: true })).toBeDisabled();
        await expect(page.getByRole("button", { name: "Swipe down", exact: true })).toBeDisabled();
        await page.getByRole("button", { name: "Next card", exact: true }).click();
        expect(await calls(page, "next")).toHaveLength(1);
        await expect(page.getByRole("slider", { name: "Viewing progress" })).toHaveValue("0");
      }
    });
  });
}

for (const width of [1280, 320, 375]) {
  test(`PLAYWRIGHT-CARD-PLAYER-31 toggles the edit shortcut at width ${width}`, async ({ page }) => {
    await test.step("Given: visible edit shortcut", async () => {
      await page.setViewportSize({ width, height: 900 });
      await widget(page, "edit-link");
      await expect(page.getByRole("link", { name: "Edit card" })).toBeVisible();
    });
    await test.step("When: open actions and hide the edit link", async () => {
      await page.getByRole("button", { name: "Open card actions" }).click();
      await expect(page.getByRole("link", { name: "Edit card" })).toHaveCount(0);
      if (width <= 439) await expect(page.locator("[data-study-card-overlay]")).toBeHidden();
      const names = [
        "Back to deck list",
        "Swipe controls",
        "Playback controls",
        "Card details",
        "Edit link",
        "Help button",
        "Close card actions",
      ];
      const bounds = await Promise.all(
        names.map((name) => page.getByRole("button", { name, exact: true }).boundingBox())
      );
      for (const [index, a] of bounds.entries())
        for (const b of bounds.slice(index + 1)) {
          expect(a).not.toBeNull();
          expect(b).not.toBeNull();
          if (a && b)
            expect(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y).toBe(
              true
            );
        }
      const toggle = page.getByRole("button", { name: "Edit link", exact: true });
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await page.keyboard.press("Escape");
    });
    await test.step("Then: escape restores focus and a second toggle restores edit", async () => {
      await expect(page.getByRole("button", { name: "Open card actions" })).toBeFocused();
      await expect(page.getByRole("link", { name: "Edit card" })).toHaveCount(0);
      await page.getByRole("button", { name: "Open card actions" }).click();
      await page.getByRole("button", { name: "Edit link", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open card actions" })).toBeFocused();
      await expect(page.getByRole("link", { name: "Edit card" })).toBeVisible();
    });
  });
}

for (const width of [1280, 375]) {
  test(`PLAYWRIGHT-CARD-PLAYER-33 hides front chrome on the answer at ${width}`, async ({ page }) => {
    await test.step("Given: a long answer with an edit shortcut", async () => {
      await page.setViewportSize({ width, height: 900 });
      await widget(page, "answer-chrome");
    });
    await test.step("When: focus the answer", async () => {
      await page.getByRole("region", { name: "Study answer" }).focus();
    });
    await test.step("Then: the answer is focusable without front chrome", async () => {
      await expect(page.getByRole("region", { name: "Study answer" })).toBeFocused();
      await expect(page.getByRole("link", { name: "Edit card" })).toHaveCount(0);
      for (const name of [
        "Back to deck list",
        "Open card actions",
        "Close card actions",
        "Play",
        "Pause",
        "Swipe left",
        "Swipe right",
        "Swipe up",
        "Swipe down",
      ])
        await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
      await expect(page.getByText("not studied yet", { exact: true })).toHaveCount(0);
      await expect(page.getByText("front text", { exact: true })).toHaveCount(0);
    });
  });
}

for (const variant of ["long-answer", "long-answer-mobile", "deck-view-answer"]) {
  test(`PLAYWRIGHT-CARD-PLAYER-33 preserves long answer layout for ${variant}`, async ({ page }) => {
    await test.step("Given: long answer", async () => {
      if (variant === "long-answer-mobile") await page.setViewportSize({ width: 375, height: 812 });
      await widget(page, variant === "long-answer-mobile" ? "long-answer" : variant);
    });
    await test.step("When: inspect answer layout", async () => {
      await expect(page.getByRole("region")).toBeVisible();
    });
    await test.step("Then: answer scrolls without controls", async () => {
      expect(await page.getByRole("region").evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
        true
      );
      await expect(page.locator("pre")).toBeVisible();
      await expect(page.getByRole("group", { name: "Card actions" })).toHaveCount(0);
      await expect(page.getByRole("slider")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Back to deck list" })).toHaveCount(0);
      for (const side of ["left", "right", "up", "down"])
        await expect(page.getByRole("button", { name: `Swipe ${side}`, exact: true })).toHaveCount(0);
    });
  });
}

test("PLAYWRIGHT-CARD-PLAYER-34 forwards overlay wheel input and clicks only the requested edge", async ({ page }) => {
  await test.step("Given: long answer and horizontal overlays", async () => {
    await widget(page, "answer-overlays");
  });
  const answer = page.getByRole("region", { name: "Study answer" });
  const left = page.getByRole("button", { name: "Swipe left", exact: true });
  let top = 0;
  await test.step("When: wheel over the left overlay", async () => {
    await expect(left).toBeVisible();
    await expect(page.getByRole("button", { name: "Swipe right", exact: true })).toBeVisible();
    top = (await left.boundingBox())!.y;
    await left.evaluate((element) =>
      element.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: innerHeight }))
    );
  });
  await test.step("Then: text scrolls while the overlay stays fixed", async () => {
    await expect.poll(() => answer.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect((await left.boundingBox())!.y).toBe(top);
    for (const side of ["up", "down"])
      await expect(page.getByRole("button", { name: `Swipe ${side}`, exact: true })).toHaveCount(0);
    expect(await readEvents(page)).toHaveLength(0);
    await left.click();
    expect(await calls(page, "edgeLeft")).toHaveLength(1);
    expect(await calls(page, "answerClick")).toHaveLength(0);
  });
});

for (const variant of ["view-mode", "reading-mobile", "reading-desktop", "reading-math"]) {
  test(`PLAYWRIGHT-CARD-PLAYER-27 keeps long reading content clear of controls ${variant}`, async ({ page }) => {
    await test.step("Given: scrollable reading front", async () => {
      if (variant === "reading-mobile") await page.setViewportSize({ width: 320, height: 568 });
      await widget(page, variant);
    });
    const surface = page.getByRole("region", { name: "Card front text" });
    await test.step("When: read the end of the front", async () => {
      await expect(surface).toBeFocused();
      expect(await surface.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
      await surface.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
    });
    await test.step("Then: text and controls do not overlap and explicit mode toggle works", async () => {
      expect(
        await surface.evaluate((element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1)
      ).toBe(true);
      const bounds = (await surface.boundingBox())!;
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(
        (await page.getByRole("button", { name: "Play", exact: true }).boundingBox())!.y
      );
      const toggle = page.getByRole("button", { name: "View mode", exact: true });
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      const b = (await toggle.boundingBox())!;
      expect(b.y + b.height).toBeLessThanOrEqual(bounds.y);
      await toggle.click();
      expect(await calls(page, "viewMode")).toHaveLength(1);
    });
  });
}

test("PLAYWRIGHT-CARD-PLAYER-27 ignores four touch directions and mouse drag while reading", async ({ page }) => {
  await test.step("Given: reading front and explicit direction control", async () => {
    await widget(page, "reading-gestures");
  });
  await test.step("When: drag the reading surface", async () => {
    const surface = page.getByRole("region", { name: "Card front text" });
    for (const [x, y] of [
      [200, 40],
      [200, 360],
      [40, 200],
      [360, 200],
    ])
      await touch(surface, x!, y!);
    await mouse(surface);
  });
  await test.step("Then: only an explicit direction click requests an action", async () => {
    expect(await readEvents(page)).toHaveLength(0);
    await page.getByRole("button", { name: "Swipe left", exact: true }).click();
    expect(await calls(page, "directionLeft")).toHaveLength(1);
  });
});

test("PLAYWRIGHT-CARD-PLAYER-28 keeps selected text in reading mode", async ({ page }) => {
  await test.step("Given: readable front text", async () => {
    await widget(page, "reading-selection");
  });
  await test.step("When: select the text then click it", async () => {
    await page.getByText("Select this front text", { exact: true }).evaluate((element) => {
      const selection = getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  });
  await test.step("Then: selection keeps the mode and a later unselected tap requests exit", async () => {
    expect(await calls(page, "viewMode")).toHaveLength(0);
    await page.getByText("Select this front text", { exact: true }).evaluate((element) => {
      getSelection()!.removeAllRanges();
      element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(await calls(page, "viewMode")).toHaveLength(1);
  });
});

test("PLAYWRIGHT-CARD-PLAYER-29 distinguishes Space from explicit reading text tap", async ({ page }) => {
  await test.step("Given: focused reading region", async () => {
    await widget(page, "reading-space");
    await expect(page.getByRole("region", { name: "Card front text" })).toBeFocused();
  });
  await test.step("When: press Space", async () => {
    await page.keyboard.press("Space");
  });
  await test.step("Then: Space does not exit and a text tap does", async () => {
    expect(await calls(page, "viewMode")).toHaveLength(0);
    await page.getByText("Readable front text", { exact: true }).click();
    expect(await calls(page, "viewMode")).toHaveLength(1);
  });
});

test("PLAYWRIGHT-CARD-PLAYER-30 preserves permitted answer click and horizontal swipe", async ({ page }) => {
  await test.step("Given: answer with explicitly enabled horizontal gestures", async () => {
    await widget(page, "answer-allowed");
  });
  await test.step("When: tap then swipe answer left", async () => {
    const answer = page.getByRole("region", { name: "Study answer" });
    await answer.click();
    await touch(answer, 40, 200);
  });
  await test.step("Then: each permitted callback runs exactly once", async () => {
    expect(await calls(page, "answerClick")).toHaveLength(1);
    expect(await calls(page, "swipeLeft")).toHaveLength(1);
  });
});

test("PLAYWRIGHT-CARD-PLAYER-43 PLAYWRIGHT-CARD-PLAYER-47 ignores forbidden answer swipes and suppresses trailing click", async ({
  page,
}) => {
  await test.step("Given: answer with horizontal gestures disabled", async () => {
    await widget(page, "answer-disallowed");
  });
  await test.step("When: swipe left and up, then drag with the mouse", async () => {
    const answer = page.getByRole("region", { name: "Study answer" });
    await touch(answer, 40, 200);
    await touch(answer, 200, 40);
    await mouse(answer, 0, 40, 200);
  });
  await test.step("Then: no direction or answer-click action is requested", async () => {
    expect(await readEvents(page)).toHaveLength(0);
  });
});

test("PLAYWRIGHT-CARD-PLAYER-44 swipes the front when direction buttons are hidden", async ({ page }) => {
  await test.step("Given: hidden direction controls", async () => {
    await widget(page, "front-swipe");
  });
  await test.step("When: swipe the front up", async () => {
    await touch(page.getByText("front text", { exact: true }), 200, 40);
  });
  await test.step("Then: the direction action runs once", async () => {
    expect(await calls(page, "swipeUp")).toHaveLength(1);
  });
});

test("PLAYWRIGHT-CARD-PLAYER-46 PLAYWRIGHT-CARD-PLAYER-45 ignores secondary buttons and suppresses primary trailing click", async ({
  page,
}) => {
  await test.step("Given: front with mouse gestures", async () => {
    await widget(page, "default");
  });
  await test.step("When: drag with middle and right buttons", async () => {
    const front = page.getByText("front text", { exact: true });
    await mouse(front, 1);
    await mouse(front, 2);
  });
  await test.step("Then: only a later primary drag requests a swipe", async () => {
    expect(await calls(page, "swipeUp")).toHaveLength(0);
    await mouse(page.getByText("front text", { exact: true }));
    expect(await calls(page, "swipeUp")).toHaveLength(1);
    expect(await calls(page, "answerClick")).toHaveLength(0);
    expect(await calls(page, "viewMode")).toHaveLength(0);
  });
});

for (const [help, view, edit] of [
  [true, true, true],
  [false, true, true],
  [true, true, false],
  [false, true, false],
  [true, false, true],
  [false, false, false],
]) {
  test(`PLAYWRIGHT-CARD-PLAYER-39 preserves shortcut combination ${String(help)}/${String(view)}/${String(edit)}`, async ({
    page,
  }) => {
    await test.step("Given: fixed shortcut visibility", async () => {
      await widget(page, "shortcuts", { help: String(help), view: String(view), edit: String(edit) });
    });
    for (let pass = 0; pass < 2; pass++) {
      await test.step("When: open the action menu and request each shortcut setting", async () => {
        await expect(page.getByTestId("toolbar-shortcuts").getByRole("button")).toHaveCount(
          1 + Number(help) + Number(view)
        );
        expect(
          await page
            .getByTestId("toolbar-shortcuts")
            .getByRole("button")
            .evaluateAll((elements) => elements.map((element) => element.getAttribute("aria-label")))
        ).toEqual(["Open card actions", ...(help ? ["Open study help"] : []), ...(view ? ["View mode"] : [])]);
        await expect(page.getByRole("link", { name: "Edit card" })).toHaveCount(Number(edit));
        await page.getByRole("button", { name: "Open card actions" }).click();
        for (const name of ["Help button", "View mode", "Edit link"])
          await page.getByRole("button", { name, exact: true }).click();
        await expect(page.getByRole("link", { name: "Edit card" })).toHaveCount(0);
        await page.keyboard.press("Escape");
      });
      await test.step("Then: each callback runs once and menu focus returns", async () => {
        for (const name of ["help", "viewShortcut", "edit"]) expect(await calls(page, name)).toHaveLength(pass + 1);
        await expect(page.getByRole("button", { name: "Open card actions" })).toBeFocused();
      });
    }
  });
}

test("PLAYWRIGHT-CARD-PLAYER-35 requests every toolbar action and restores focus", async ({ page }) => {
  await test.step("Given: toolbar with all controls", async () => {
    await widget(page, "toolbar");
    await expect(page.getByRole("button", { name: "Open card actions" })).toHaveAttribute("aria-expanded", "false");
  });
  await test.step("When: open actions and request back and display toggles", async () => {
    await page.getByRole("button", { name: "Open card actions" }).click();
    await expect(page.getByRole("button", { name: "Close card actions" })).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Help button", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await page.getByRole("button", { name: "Back to deck list" }).click();
    for (const name of ["Swipe controls", "Playback controls", "Skip control", "Card details"]) {
      const button = page.getByRole("button", { name, exact: true });
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await button.click();
    }
    await page.keyboard.press("Escape");
  });
  await test.step("Then: callbacks match the requested actions", async () => {
    for (const name of ["back", "swipeControls", "playbackControls", "skipControls", "details"])
      expect(await calls(page, name)).toHaveLength(1);
    await expect(page.getByRole("button", { name: "Open card actions" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Open study help" })).toBeVisible();
  });
});

for (const [variant, label, description, callback] of [
  ["default", "Help button", "Show help button", "help"],
  ["reading-visibility", "View mode", "Show view mode button", "viewShortcut"],
  ["default", "Card details", "Show card details", "details"],
]) {
  test(`PLAYWRIGHT-CARD-PLAYER-36 PLAYWRIGHT-CARD-PLAYER-40 toggles ${label} visibility and restores it`, async ({
    page,
  }) => {
    await test.step("Given: visible display control", async () => {
      await widget(page, variant!);
    });
    await test.step("When: hide and restore its display", async () => {
      await page.getByRole("button", { name: "Open card actions" }).click();
      const toggle = page.getByRole("button", { name: label!, exact: true });
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await expect(toggle).toHaveAccessibleDescription(description!);
      if (label === "Card details") await expect(page.getByText("not studied yet", { exact: true })).toHaveCount(0);
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      if (label === "Card details") {
        await expect(toggle).toHaveAccessibleDescription("Hide card details");
        await expect(page.getByText("not studied yet", { exact: true })).toBeVisible();
      }
    });
    await test.step("Then: only the corresponding callback ran twice", async () => {
      expect(await calls(page, callback!)).toHaveLength(2);
      expect(await calls(page, "viewMode")).toHaveLength(0);
    });
  });
}

test("PLAYWRIGHT-CARD-PLAYER-38 hides the reading shortcut without changing reading mode", async ({ page }) => {
  await test.step("Given: active reading mode", async () => {
    await widget(page, "reading-visibility");
  });
  for (const visible of [false, true]) {
    await test.step("When: change shortcut visibility", async () => {
      await page.getByRole("button", { name: "Open card actions" }).click();
      await page.getByRole("button", { name: "View mode", exact: true }).click();
      await page.keyboard.press("Escape");
    });
    await test.step("Then: the reading state remains active", async () => {
      await expect(page.getByRole("button", { name: "Open card actions" })).toBeFocused();
      await expect(page.getByRole("region", { name: "Card front text" })).toBeVisible();
      if (visible)
        await expect(page.getByRole("button", { name: "View mode", exact: true })).toHaveAccessibleDescription(
          "Exit view mode"
        );
      else await expect(page.getByRole("button", { name: "View mode", exact: true })).toHaveCount(0);
    });
  }
  expect(await calls(page, "viewShortcut")).toHaveLength(2);
  expect(await calls(page, "viewMode")).toHaveLength(0);
});

test("PLAYWRIGHT-CARD-PLAYER-37 reflects a reading mode change", async ({ page }) => {
  await test.step("Given: reading mode off", async () => {
    await widget(page, "reading-toggle");
    await expect(page.getByRole("button", { name: "View mode", exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: "View mode", exact: true })).toHaveAccessibleDescription(
      "Enter view mode"
    );
  });
  await test.step("When: enter reading mode", async () => {
    await page.getByRole("button", { name: "View mode", exact: true }).click();
  });
  await test.step("Then: pressed state and description reflect the change", async () => {
    expect(await calls(page, "viewMode")).toHaveLength(1);
    await expect(page.getByRole("button", { name: "View mode", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "View mode", exact: true })).toHaveAccessibleDescription(
      "Exit view mode"
    );
  });
});

test("PLAYWRIGHT-CARD-PLAYER-41 explains unavailable playback without requesting it", async ({ page }) => {
  await test.step("Given: unavailable playback and hidden controls", async () => {
    await widget(page, "unavailable-explanation");
  });
  await test.step("When: focus and click unavailable playback", async () => {
    await page.getByRole("button", { name: "Open card actions" }).click();
    await expect(page.getByRole("button", { name: "Swipe controls", exact: true })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    await expect(page.getByRole("button", { name: "Swipe controls", exact: true })).toHaveAccessibleDescription(
      "Show swipe controls"
    );
    const playback = page.getByRole("button", { name: "Playback controls", exact: true });
    await playback.focus();
    await expect(playback).toBeFocused();
    await expect(playback).toHaveAttribute("aria-disabled", "true");
    const reason = "Playback controls unavailable because the card interval is set to 0";
    await expect(playback).toHaveAttribute("title", reason);
    await expect(playback).toHaveAccessibleDescription(reason);
    await playback.dispatchEvent("click");
  });
  await test.step("Then: no playback callback runs", async () => {
    expect(await calls(page, "playbackControls")).toHaveLength(0);
  });
});

for (const [variant, play, swipe] of [
  ["playback-only", true, false],
  ["swipe-only", false, true],
  ["controls-hidden", false, false],
] as const) {
  test(`PLAYWRIGHT-CARD-PLAYER-42 displays ${variant}`, async ({ page }) => {
    await test.step("Given: independent bottom control visibility", async () => {
      await widget(page, variant);
    });
    await test.step("When: inspect rendered controls", async () => {
      await expect(page.getByText("front text", { exact: true })).toBeVisible();
    });
    await test.step("Then: only selected control groups exist", async () => {
      await expect(page.getByRole("button", { name: "Play", exact: true })).toHaveCount(Number(play));
      await expect(page.getByRole("button", { name: "Swipe left", exact: true })).toHaveCount(Number(swipe));
    });
  });
}

for (const variant of ["default", "rated"]) {
  test(`PLAYWRIGHT-CARD-PLAYER-48 displays supplied study metadata ${variant}`, async ({ page }) => {
    await test.step("Given: unstudied or rated card", async () => {
      await widget(page, variant);
    });
    await test.step("When: inspect metadata", async () => {
      await expect(page.getByText("front text", { exact: true })).toBeVisible();
    });
    await test.step("Then: unstudied and difficulty are distinct", async () => {
      await expect(page.getByText("not studied yet", { exact: true })).toHaveCount(Number(variant === "default"));
      await expect(page.getByText(/FSRS D: 8/)).toHaveCount(Number(variant === "rated"));
    });
  });
}

test("PLAYWRIGHT-STUDY-CONTROLS-11 component requests playback once and updates pressed state", async ({ page }) => {
  await test.step("Given: stopped controller", async () => {
    await widget(page, "controller");
  });
  await test.step("When: click Play", async () => {
    await page.getByRole("button", { name: "Play", exact: true }).click();
  });
  await test.step("Then: playback is requested once", async () => {
    expect(await calls(page, "play")).toHaveLength(1);
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveAttribute("aria-pressed", "true");
  });
});

test("PLAYWRIGHT-STUDY-CONTROLS-12 component requests playback once with Enter", async ({ page }) => {
  await test.step("Given: focused stopped controller", async () => {
    await widget(page, "controller");
    await page.getByRole("button", { name: "Play", exact: true }).focus();
  });
  await test.step("When: press Enter", async () => {
    await page.keyboard.press("Enter");
  });
  await test.step("Then: playback is requested once", async () => {
    expect(await calls(page, "play")).toHaveLength(1);
  });
});

test("PLAYWRIGHT-STUDY-CONTROLS-13 component emits a numeric position", async ({ page }) => {
  await test.step("Given: controller slider", async () => {
    await widget(page, "controller-position");
  });
  await test.step("When: select position three", async () => {
    await page.getByRole("slider").fill("3");
  });
  await test.step("Then: position callback carries a number", async () => {
    expect((await calls(page, "position")).at(-1)?.args).toEqual([3]);
  });
});

for (const variant of ["directions", "disabled-direction"]) {
  test(`PLAYWRIGHT-STUDY-CONTROLS-14 PLAYWRIGHT-STUDY-CONTROLS-15 component handles ${variant} keyboard activation`, async ({
    page,
  }) => {
    await test.step("Given: direction control", async () => {
      await widget(page, variant);
    });
    await test.step("When: activate or tab past left", async () => {
      const left = page.getByRole("button", { name: "Swipe left", exact: true });
      if (variant === "directions") {
        await left.focus();
        await page.keyboard.press("Enter");
      } else {
        await expect(left).toBeVisible();
        await left.dispatchEvent("click");
        await page.getByRole("button", { name: "Before directions" }).focus();
        await page.keyboard.press("Tab");
      }
    });
    await test.step("Then: enabled activation runs once and disabled stays excluded", async () => {
      expect(await calls(page, "left")).toHaveLength(Number(variant === "directions"));
      if (variant === "disabled-direction")
        await expect(page.getByRole("button", { name: "Swipe up", exact: true })).toBeFocused();
    });
  });
}

test("PLAYWRIGHT-STUDY-CONTROLS-16 component requests Skip exactly once", async ({ page }) => {
  await test.step("Given: ready Skip", async () => {
    await widget(page, "save-controls");
  });
  await test.step("When: click Skip", async () => {
    await page.getByRole("button", { name: "Skip", exact: true }).click();
  });
  await test.step("Then: the callback runs once", async () => {
    expect(await calls(page, "skip")).toHaveLength(1);
  });
});

test("PLAYWRIGHT-CARD-PLAYER-25 uses application colors for dark mathematical answers", async ({ page }) => {
  await test.step("Given: a dark mathematical answer", async () => {
    await widget(page, "dark-math");
  });
  await test.step("When: inspect rendered markdown colors", async () => {
    await expect(page.locator(".markdown-body")).toBeVisible();
  });
  await test.step("Then: foreground and border use the application theme", async () => {
    expect(
      await page.locator(".markdown-body").evaluate((element) => {
        const style = getComputedStyle(element);
        return [
          style.getPropertyValue("--fgColor-default").trim() === style.getPropertyValue("--calm-color-ink").trim(),
          style.getPropertyValue("--borderColor-muted").trim() === style.getPropertyValue("--calm-color-border").trim(),
        ];
      })
    ).toEqual([true, true]);
  });
});

test("PLAYWRIGHT-CARD-PLAYER-32 omits edit settings when there is no edit operation", async ({ page }) => {
  await test.step("Given: a player without edit operation", async () => {
    await widget(page, "default");
  });
  await test.step("When: open actions", async () => {
    await page.getByRole("button", { name: "Open card actions" }).click();
  });
  await test.step("Then: no edit link setting exists", async () => {
    await expect(page.getByRole("button", { name: "Edit link", exact: true })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-CARD-PLAYER-26 keeps narrow actions below the back shortcut and inside the viewport", async ({
  page,
}) => {
  await test.step("Given: a 320px player", async () => {
    await page.setViewportSize({ width: 320, height: 568 });
    await widget(page, "default");
  });
  await test.step("When: open card actions", async () => {
    await page.getByRole("button", { name: "Open card actions" }).click();
  });
  await test.step("Then: actions fit without covering card metadata", async () => {
    const back = (await page.getByRole("button", { name: "Back to deck list" }).boundingBox())!;
    const actions = (await page.getByRole("group", { name: "Card actions" }).boundingBox())!;
    expect(actions.y).toBeGreaterThanOrEqual(back.y + back.height);
    expect(actions.x + actions.width).toBeLessThanOrEqual(320);
    await expect(page.locator("[data-study-card-overlay]")).toBeHidden();
  });
});
