import type { Page } from "@playwright/test";
import type { Card } from "@/entities/card";
import { callScenario, expect, open, readEvents, test } from "./fixtures";

const domain = "card-forms";
const mathDraft = "**Draft**\n\n$x^2$\n\n| A | B |\n| --- | --- |\n| 1 | 2 |";
const requests = async (page: Page) =>
  (await readEvents(page))
    .filter((event) => event.name === "createCard" || event.name === "editCard")
    .map((event) => ({
      kind: event.name === "createCard" ? "create" : "edit",
      uid: event.args[0],
      input: event.args[1],
    }));
const command = <T = unknown>(page: Page, name: string, value?: unknown) => callScenario<T>(page, domain, name, value);
async function fill(page: Page, front = "Hello", back = "Hola") {
  await page.getByRole("textbox", { name: "Front text", exact: true }).fill(front);
  await page.getByRole("tab", { name: "Back", exact: true }).click();
  await page.getByRole("textbox", { name: "Back text", exact: true }).fill(back);
}

test("PLAYWRIGHT-CARD-FORM-05 creates both sides and a trimmed custom tag", async ({ page }) => {
  await test.step("Given: an empty target deck", () => open(page, domain, "create"));
  await test.step("When: enter both sides and remove then re-add an unblurred tag", async () => {
    await fill(page);
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await page.getByRole("button", { name: "Add tag", exact: true }).click();
    await page.getByRole("textbox", { name: "Tag name 1" }).fill(" new tag ");
    await page.getByRole("dialog").getByText("new tag", { exact: true }).click();
  });
  await test.step("Then: the selected tag row is removed", async () => {
    await expect(page.getByRole("textbox", { name: "Tag name 1" })).toHaveCount(0);
  });
  await test.step("When: add the tag and create the card", async () => {
    await page.getByRole("button", { name: "Add tag", exact: true }).click();
    await page.getByRole("textbox", { name: "Tag name 1" }).fill(" new tag ");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Create card", exact: true }).click();
  });
  await test.step("Then: save once, announce success, and read the card in the target deck", async () => {
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
    await expect(page.getByRole("status", { name: "Toast notifications" })).toContainText("Created card “Hello”.");
    await expect(page.getByRole("article").getByText("new tag", { exact: true })).toBeVisible();
    const saved = await requests(page);
    expect(saved).toMatchObject([
      {
        kind: "create",
        uid: "playwright-user",
        input: { frontText: "Hello", backText: "Hola", tags: ["new tag"], deckId: "form-deck" },
      },
    ]);
    expect(saved).toHaveLength(1);
    await page.getByRole("button", { name: "View Hello", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Hello", exact: true })).toContainText("Hola");
  });
});

test("PLAYWRIGHT-CARD-FORM-17 announces the submitted creation content", async ({ page }) => {
  await test.step("Given: a ready card creation screen", () => open(page, domain, "create"));
  await test.step("When: create the entered content", async () => {
    await fill(page, "Front value", "Back value");
    await page.getByRole("button", { name: "Create card", exact: true }).click();
  });
  await test.step("Then: the external write contains both sides and the success is announced", async () => {
    await expect(page.getByRole("status", { name: "Toast notifications" })).toContainText(
      "Created card “Front value”."
    );
    expect(await requests(page)).toMatchObject([
      { kind: "create", input: { frontText: "Front value", backText: "Back value", tags: [], deckId: "form-deck" } },
    ]);
  });
});

test("PLAYWRIGHT-CARD-FORM-18 retains both creation inputs after failure and retries", async ({ page }) => {
  await test.step("Given: a rejected first external write", () => open(page, domain, "create-retry"));
  await test.step("When: create a card", async () => {
    await fill(page);
    await page.getByRole("button", { name: "Create card", exact: true }).click();
  });
  await test.step("Then: show the failure and retain both inputs", async () => {
    await expect(page.getByRole("alert")).toContainText("Unable to create this card. Try again.");
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("Hola");
    await page.getByRole("tab", { name: "Front", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Hello");
  });
  await test.step("When: explicitly retry", () =>
    page.getByRole("button", { name: "Create card", exact: true }).click());
  await test.step("Then: show one created card and success", async () => {
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
    await expect(page.getByRole("status", { name: "Toast notifications" })).toContainText("Created card “Hello”.");
    await expect(page.getByRole("button", { name: "View Hello", exact: true })).toHaveCount(1);
    const writes = await requests(page);
    expect(writes).toHaveLength(2);
    const inputs = writes.map(({ input }) => input as Parameters<typeof import("@/entities/card").createCard>[1]);
    for (const input of inputs) {
      expect(input).toMatchObject({
        id: expect.stringMatching(/\S/u),
        frontText: "Hello",
        backText: "Hola",
        tags: [],
        deckId: "form-deck",
      });
      expect(input.uniqueKey).toBe(input.id);
    }
    expect(inputs[0]?.id).not.toBe(inputs[1]?.id);
  });
});

for (const stage of ["immediate", "validation", "persistence"] as const) {
  test(`PLAYWRIGHT-CARD-FORM-19 suppresses duplicate creation during ${stage}`, async ({ page }) => {
    await test.step("Given: a controlled creation stage", () => open(page, domain, `create-${stage}`));
    await test.step("When: repeatedly submit both entered sides", async () => {
      await fill(page, "Front value", "Back value");
      const button = page.getByRole("button", { name: /^(Create card|Creating…)$/ });
      if (stage === "immediate") {
        await button.dispatchEvent("click");
        await button.dispatchEvent("click");
      } else await button.dblclick();
    });
    await test.step("Then: disable repeated input without duplicate writes", async () => {
      await expect(page.getByRole("button", { name: "Creating…", exact: true })).toBeDisabled();
      await page.getByRole("button", { name: "Creating…", exact: true }).evaluate((element: HTMLButtonElement) => {
        element.click();
        element.click();
      });
      if (stage === "validation") expect(await requests(page)).toHaveLength(0);
    });
    await test.step("When: complete the controlled operation", () => command(page, "finish"));
    await test.step("Then: exactly one external creation completes and submission becomes available", async () => {
      await expect(page.getByRole("button", { name: "Create card", exact: true })).toBeEnabled();
      expect(await requests(page)).toHaveLength(1);
    });
  });
}

test("PLAYWRIGHT-CARD-FORM-19 creates one card after a pending Page submission", async ({ page }) => {
  await test.step("Given: a Page with pending persistence", () => open(page, domain, "create-pending"));
  await test.step("When: double click Create card", async () => {
    await fill(page);
    await page.getByRole("button", { name: "Create card", exact: true }).dblclick();
  });
  await test.step("Then: creation is disabled", () =>
    expect(page.getByRole("button", { name: "Creating…", exact: true })).toBeDisabled());
  await test.step("When: persistence completes", () => command(page, "finish"));
  await test.step("Then: one card is listed and a new creation is enabled", async () => {
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
    await expect(page.getByText("Hello", { exact: true })).toHaveCount(1);
    expect(await requests(page)).toHaveLength(1);
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add card", exact: true }).click();
    await expect(page.getByRole("button", { name: "Create card", exact: true })).toBeEnabled();
  });
});

test("PLAYWRIGHT-CARD-CREATE-01 rejects empty sides without a success toast", async ({ page }) => {
  await test.step("Given: empty card creation", () => open(page, domain, "create"));
  await test.step("When: submit no values", () =>
    page.getByRole("button", { name: "Create card", exact: true }).click());
  await test.step("Then: show required validation without a write or success", async () => {
    await expect(page.getByText("Front text is required.", { exact: true })).toBeVisible();
    await expect(page.getByText(/Created card/)).toHaveCount(0);
    expect(await requests(page)).toEqual([]);
    await page.getByRole("textbox", { name: "Front text" }).fill("Fixed");
    await expect(page.getByRole("button", { name: "Create card", exact: true })).toBeEnabled();
  });
});

test("PLAYWRIGHT-CARD-CREATE-02 previews the unsaved answer and retains the draft", async ({ page }) => {
  const back = "**Strong answer** $x^2$";
  await test.step("Given: an unsaved math answer", async () => {
    await open(page, domain, "create");
    await fill(page, "Draft", back);
  });
  await test.step("When: open answer preview", () =>
    page.getByRole("button", { name: "Preview answer", exact: true }).click());
  await test.step("Then: render bold and math", async () => {
    const preview = page.getByRole("region", { name: "Answer preview" });
    await expect(preview.locator("strong")).toHaveText("Strong answer");
    await expect(preview.locator(".katex")).toBeVisible();
  });
  await test.step("When: hide preview", () => page.getByRole("button", { name: "Hide preview", exact: true }).click());
  await test.step("Then: preserve the unsaved input without creating a card", async () => {
    await expect(page.getByRole("region", { name: "Answer preview" })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue(back);
    await expect(page.getByText(/Created card/)).toHaveCount(0);
    expect(await requests(page)).toEqual([]);
  });
});

test("PLAYWRIGHT-CARD-FORM-01 retains the front draft across tabs", async ({ page }) => {
  await test.step("Given: an existing card edit", () => open(page, domain, "edit"));
  await test.step("When: replace the prompt and switch away and back", async () => {
    await page.getByRole("textbox", { name: "Front text" }).fill("Updated prompt");
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated prompt");
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("tab", { name: "Front", exact: true }).click();
  });
  await test.step("Then: retain the prompt", () =>
    expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated prompt"));
});

test("PLAYWRIGHT-CARD-FORM-02 selects an unchecked raw tag and updates its summary", async ({ page }) => {
  await test.step("Given: a raw candidate not selected by the existing card", () => open(page, domain, "edit"));
  await test.step("When: open tag editing and select raw", async () => {
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await expect(page.getByRole("checkbox", { name: "raw", exact: true })).not.toBeChecked();
    await page.getByRole("checkbox", { name: "raw", exact: true }).locator("xpath=parent::label").click();
  });
  await test.step("Then: raw is checked and included in the summary", async () => {
    await expect(page.getByRole("checkbox", { name: "raw", exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await expect(page.getByRole("button", { name: "Edit tags", exact: true })).toHaveAccessibleDescription(
      "language, custom, raw"
    );
  });
});

test("PLAYWRIGHT-CARD-FORM-03 associates Japanese validation and document language", async ({ page }) => {
  await test.step("Given: Japanese edit with an empty front", () => open(page, domain, "japanese-error"));
  await test.step("When: save", () => page.getByRole("button", { name: "変更を保存", exact: true }).click());
  await test.step("Then: expose the translated required error", async () => {
    await expect(page.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
      "表面のテキストは必須です。"
    );
    await expect(page.getByRole("alert")).toContainText("表面のテキストは必須です。");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  });
});

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
]) {
  test(`PLAYWRIGHT-CARD-FORM-04 renders bold math at width ${viewport.width}`, async ({ page }) => {
    await test.step("Given: a math answer", async () => {
      await page.setViewportSize(viewport);
      await open(page, domain, "preview");
    });
    await test.step("When: open the answer preview", async () => {
      await page.getByRole("tab", { name: "Back", exact: true }).click();
      await page.getByRole("button", { name: "Preview answer", exact: true }).click();
    });
    await test.step("Then: render the draft, math, and the preview region", async () => {
      const preview = page.getByRole("region", { name: "Answer preview" });
      await expect(preview).toBeVisible();
      await expect(preview.locator("strong")).toHaveText("Draft");
      await expect(preview.locator(".katex")).toBeVisible();
    });
  });
}

test("PLAYWRIGHT-CARD-FORM-06 retains both expanded drafts and restores focus", async ({ page }) => {
  await test.step("Given: both sides ready to edit", () => open(page, domain, "edit"));
  await test.step("When: edit the front and expand then edit the back", async () => {
    await page.getByRole("textbox", { name: "Front text" }).fill("Updated front");
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Expand Back" }).click();
    await page.getByRole("dialog").getByRole("textbox", { name: "Back text" }).fill("Updated back");
    await page.keyboard.press("Escape");
  });
  await test.step("Then: retain both values and restore expansion trigger focus", async () => {
    await expect(page.getByRole("button", { name: "Expand Back" })).toBeFocused();
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("Updated back");
    await page.getByRole("tab", { name: "Front", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated front");
  });
});

test("PLAYWRIGHT-CARD-FORM-07 retains custom selections, summary count, focus, and saved tags", async ({ page }) => {
  await test.step("Given: custom and language selected", () => open(page, domain, "edit"));
  await test.step("When: deselect and reselect custom, add math, and reopen", async () => {
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await page.getByRole("checkbox", { name: "custom", exact: true }).locator("xpath=parent::label").click();
    await expect(page.getByRole("checkbox", { name: "custom", exact: true })).not.toBeChecked();
    await page.getByRole("checkbox", { name: "custom", exact: true }).locator("xpath=parent::label").click();
    await page.getByRole("checkbox", { name: "math", exact: true }).locator("xpath=parent::label").click();
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
  });
  await test.step("Then: retain all selected tags", async () => {
    for (const name of ["language", "custom", "math"])
      await expect(page.getByRole("checkbox", { name, exact: true })).toBeChecked();
  });
  await test.step("When: close with Escape", () => page.keyboard.press("Escape"));
  await test.step("Then: return focus and describe all three tags in the compact summary", async () => {
    await expect(page.getByRole("button", { name: "Edit tags", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "Edit tags", exact: true })).toHaveAccessibleDescription(
      "language, custom, math"
    );
    await expect(page.getByText("+1", { exact: true })).toBeVisible();
  });
  await test.step("When: save", () => page.getByRole("button", { name: "Save changes", exact: true }).click());
  await test.step("Then: submit both sides and selected tags and show them on the saved card", async () => {
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
    const row = page
      .getByRole("article")
      .filter({ has: page.getByRole("button", { name: "View Front", exact: true }) });
    for (const name of ["language", "custom", "math"]) await expect(row.getByText(name, { exact: true })).toBeVisible();
    expect(await requests(page)).toMatchObject([
      {
        kind: "edit",
        input: { id: "form-card", frontText: "Front", backText: "Back", tags: ["language", "custom", "math"] },
      },
    ]);
  });
});

test("PLAYWRIGHT-CARD-FORM-08 switches selected side and tab focus with all navigation keys", async ({ page }) => {
  await test.step("Given: front tab focused", async () => {
    await open(page, domain, "edit");
    await page.getByRole("tab", { name: "Front", exact: true }).focus();
  });
  for (const [key, side] of [
    ["ArrowRight", "Back"],
    ["Home", "Front"],
    ["End", "Back"],
    ["ArrowLeft", "Front"],
  ] as const) {
    await test.step(`When: press ${key}`, () => page.keyboard.press(key!));
    await test.step(`Then: ${side} is selected, focused, and visible`, async () => {
      await expect(page.getByRole("tab", { name: side, exact: true })).toBeFocused();
      await expect(page.getByRole("tab", { name: side, exact: true })).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("textbox", { name: `${side} text` })).toBeVisible();
    });
  }
});

test("PLAYWRIGHT-CARD-FORM-09 reveals and describes invalid back in ordinary and expanded editing", async ({
  page,
}) => {
  await test.step("Given: an empty back", () => open(page, domain, "back-error"));
  await test.step("When: save", () => page.getByRole("button", { name: "Save changes", exact: true }).click());
  await test.step("Then: select and focus the invalid back without a write", async () => {
    await expect(page.getByRole("textbox", { name: "Back text" })).toBeFocused();
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveAccessibleDescription(
      "Back text is required."
    );
    await expect(page.getByRole("tab", { name: "Back", exact: true })).toHaveAttribute("aria-selected", "true");
    expect(await requests(page)).toEqual([]);
  });
  await test.step("When: expand Back", () => page.getByRole("button", { name: "Expand Back" }).click());
  await test.step("Then: the expanded field remains invalid with its alert", async () => {
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("textbox", { name: "Back text" })).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByRole("textbox", { name: "Back text" })).toHaveAccessibleDescription(
      "Back text is required."
    );
    await expect(dialog.getByRole("alert")).toContainText("Back text is required.");
  });
  await test.step("When: close and return to Front", async () => {
    await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: "Front", exact: true }).click();
  });
  await test.step("Then: preserve Front", () =>
    expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Front"));
});

test("PLAYWRIGHT-CARD-FORM-10 translates unknown RHF errors without leaking diagnostics", async ({ page }) => {
  await test.step("Given: a real editor model with a public RHF unknown error", () =>
    open(page, domain, "unknown-error"));
  await test.step("When: expand Front and change language", async () => {
    await page.getByRole("button", { name: "Expand Front" }).click();
    await command(page, "setLanguage", "ja");
  });
  await test.step("Then: preserve input and show the generic translated error", async () => {
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("textbox", { name: "表面のテキスト" })).toHaveValue("Front");
    await expect(dialog.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
      "入力内容が正しくありません。"
    );
    await expect(dialog.getByRole("alert")).toContainText("入力内容が正しくありません。");
    await expect(page.getByText("private diagnostic")).toHaveCount(0);
  });
  await test.step("When: finish expanded editing", () =>
    page.getByRole("dialog").getByRole("button", { name: "完了", exact: true }).click());
  await test.step("Then: preserve the generic error in normal editing", () =>
    expect(page.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
      "入力内容が正しくありません。"
    ));
});

test("PLAYWRIGHT-CARD-FORM-11 corrects a translated error without losing drafts or tags", async ({ page }) => {
  await test.step("Given: an empty front and unsaved Japanese back", () => open(page, domain, "localized"));
  await test.step("When: validate and change language", async () => {
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await command(page, "setLanguage", "ja");
  });
  await test.step("Then: keep the screen and tag summary without submission", async () => {
    await expect(page.getByRole("heading", { name: "カードを編集", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "タグを編集", exact: true })).toHaveAccessibleDescription(
      "language, custom"
    );
    expect(await requests(page)).toEqual([]);
  });
  await test.step("When: correct the front in expanded editing", async () => {
    await page.getByRole("button", { name: "表面を拡大", exact: true }).click();
    const input = page.getByRole("dialog").getByRole("textbox", { name: "表面のテキスト" });
    await expect(input).toHaveAccessibleDescription("表面のテキストは必須です。");
    await input.fill("修正した問題");
    await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: "裏面", exact: true }).click();
  });
  await test.step("Then: retain the Japanese back draft", () =>
    expect(page.getByRole("textbox", { name: "裏面のテキスト" })).toHaveValue("未保存の回答"));
  await test.step("When: save the corrected card", () =>
    page.getByRole("button", { name: "変更を保存", exact: true }).click());
  await test.step("Then: save both drafts and tags and read the answer", async () => {
    await expect(page.getByRole("button", { name: "修正した問題を表示", exact: true })).toBeVisible();
    expect(await requests(page)).toMatchObject([
      { input: { frontText: "修正した問題", backText: "未保存の回答", tags: ["language", "custom"] } },
    ]);
    await page.getByRole("button", { name: "修正した問題を表示", exact: true }).click();
    await expect(page.getByText("未保存の回答", { exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-CARD-FORM-12 previews incomplete raw content without saving or validation", async ({ page }) => {
  await test.step("Given: an incomplete raw draft", () => open(page, domain, "incomplete"));
  await test.step("When: open Back preview", async () => {
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Preview answer", exact: true }).click();
  });
  await test.step("Then: render the multiline raw answer", async () => {
    const preview = page.getByRole("region", { name: "Answer preview" });
    await expect(preview).toHaveText("First\nSecond");
    await expect(preview.locator("pre")).toHaveText("First\nSecond");
  });
  await test.step("When: close with Enter", () => page.keyboard.press("Enter"));
  await test.step("Then: restore focus and preserve both drafts without errors or writes", async () => {
    await expect(page.getByRole("button", { name: "Preview answer", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "Preview answer", exact: true })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("First\nSecond");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.getByRole("tab", { name: "Front", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("");
    await expect(page.getByRole("heading", { name: "Edit card", exact: true })).toBeVisible();
    expect(await requests(page)).toEqual([]);
  });
});

test("PLAYWRIGHT-CARD-FORM-13 updates expanded math preview and retains the front error", async ({ page }) => {
  await test.step("Given: a front validation error", async () => {
    await open(page, domain, "front-error");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
  });
  await test.step("When: enter math in expanded Back and preview it", async () => {
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Expand Back" }).click();
    await page.getByRole("dialog").getByRole("textbox", { name: "Back text" }).fill(mathDraft);
    await page.getByRole("dialog").getByRole("button", { name: "Preview answer", exact: true }).click();
  });
  await test.step("Then: render strong, math, and table", async () => {
    const preview = page.getByRole("dialog").getByRole("region", { name: "Answer preview" });
    await expect(preview.locator("strong")).toHaveText("Draft");
    await expect(preview.locator(".katex")).toBeVisible();
    await expect(preview.getByRole("table")).toBeVisible();
  });
  await test.step("When: update the still-open preview", () =>
    page.getByRole("dialog").getByRole("textbox", { name: "Back text" }).fill(mathDraft.replace("Draft", "Changed")));
  await test.step("Then: preview updates immediately", () =>
    expect(
      page.getByRole("dialog").getByRole("region", { name: "Answer preview" }).getByText("Changed", { exact: true })
    ).toBeVisible());
  await test.step("When: close and return to Front", async () => {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue(mathDraft.replace("Draft", "Changed"));
    await page.getByRole("tab", { name: "Front", exact: true }).click();
  });
  await test.step("Then: the existing front error remains", async () => {
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveAccessibleDescription(
      "Front text is required."
    );
    await expect(page.getByRole("alert")).toContainText("Front text is required.");
  });
});

for (const [category, tags, language, dark] of [
  ["python", [], "python", false],
  ["math", ["custom", "typescript", "python"], "typescript", false],
  ["math", ["custom", "typescript", "python"], "typescript", true],
  ["math", ["md"], "md", false],
] as const) {
  test(`PLAYWRIGHT-CARD-FORM-14 chooses ${language} with initial dark ${dark}`, async ({ page }) => {
    await test.step("Given: a deck category, ordered tags, and theme", () =>
      open(page, domain, "code", { category, tags: JSON.stringify(tags), dark: String(dark) }));
    await test.step("When: open the code preview", async () => {
      await page.getByRole("tab", { name: "Back", exact: true }).click();
      await page.getByRole("button", { name: "Preview answer", exact: true }).click();
    });
    await test.step("Then: render the chosen language and current theme without math", async () => {
      const preview = page.getByRole("region", { name: "Answer preview" });
      await expect(preview.locator("code")).toHaveAttribute("data-language", language);
      await expect(preview.locator("code")).toHaveText("const answer = 42;");
      await expect(preview.locator("code")).toHaveAttribute("data-theme", dark ? "dark" : "light");
      await expect(preview.locator(".katex")).toHaveCount(0);
    });
    await test.step("When: change theme", () =>
      page.getByRole("button", { name: dark ? "Switch to light mode" : "Switch to dark mode", exact: true }).click());
    await test.step("Then: update the open code preview theme", () =>
      expect(page.getByRole("region", { name: "Answer preview" }).locator("code")).toHaveAttribute(
        "data-theme",
        dark ? "light" : "dark"
      ));
  });
}

test("PLAYWRIGHT-CARD-FORM-15 updates open preview after format tag changes", async ({ page }) => {
  await test.step("Given: a python-tagged math deck draft", () => open(page, domain, "preview-tags"));
  await test.step("When: preview Back", async () => {
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Preview answer", exact: true }).click();
  });
  await test.step("Then: show python code", () =>
    expect(page.getByRole("region", { name: "Answer preview" }).locator("code")).toHaveAttribute(
      "data-language",
      "python"
    ));
  await test.step("When: remove python", async () => {
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await page.getByRole("checkbox", { name: "python", exact: true }).locator("xpath=parent::label").click();
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
  });
  await test.step("Then: use math markdown", () =>
    expect(page.getByRole("region", { name: "Answer preview" }).locator("strong")).toHaveText("Draft"));
  await test.step("When: select raw", async () => {
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await page.getByRole("checkbox", { name: "raw", exact: true }).locator("xpath=parent::label").click();
    await page.keyboard.press("Escape");
  });
  await test.step("Then: show literal draft without changing the input", async () => {
    await expect(page.getByRole("region", { name: "Answer preview" })).toHaveText("**Draft**");
    await expect(page.getByRole("region", { name: "Answer preview" }).locator("strong")).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("**Draft**");
  });
});

for (const width of [1280, 375]) {
  test(`PLAYWRIGHT-CARD-FORM-16 keeps the preview open during language changes at width ${width}`, async ({ page }) => {
    await test.step("Given: an open answer preview", async () => {
      await page.setViewportSize({ width, height: 812 });
      await open(page, domain, "preview");
      await page.getByRole("tab", { name: "Back", exact: true }).click();
      await page.getByRole("button", { name: "Preview answer", exact: true }).click();
    });
    await test.step("When: change to Japanese", () => command(page, "setLanguage", "ja"));
    await test.step("Then: translate the open region and expanded trigger", async () => {
      await expect(page.getByRole("region", { name: "解答プレビュー" })).toBeVisible();
      await expect(page.getByRole("button", { name: "プレビューを閉じる", exact: true })).toHaveAttribute(
        "aria-expanded",
        "true"
      );
    });
  });
}

test("PLAYWRIGHT-CARD-FORM-20 disables editing and departure during a pending save", async ({ page }) => {
  await test.step("Given: an external write held pending", () => open(page, domain, "edit-pending"));
  await test.step("When: change and save the front", async () => {
    await page.getByRole("textbox", { name: "Front text" }).fill("Front changed");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
  });
  await test.step("Then: disable all editing and departure controls", async () => {
    for (const name of ["Saving…", "Cancel", "Back to cards"])
      await expect(page.getByRole("button", { name, exact: true })).toBeDisabled();
    await expect(page.getByRole("textbox", { name: "Front text" })).toBeDisabled();
  });
  await test.step("When: finish persistence", () => command(page, "finish"));
  await test.step("Then: list the saved content once", async () => {
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "View Front changed", exact: true })).toBeEnabled();
    expect(await requests(page)).toHaveLength(1);
  });
});

test("PLAYWRIGHT-CARD-FORM-21 retains the opening snapshot after external store updates", async ({ page }) => {
  await test.step("Given: Front text and Back text opened for editing", () => open(page, domain, "external"));
  await test.step("When: edit front and receive different remote content", async () => {
    await page.getByRole("textbox", { name: "Front text" }).fill("Unsaved front");
    await command(page, "receiveExternal");
  });
  await test.step("Then: retain the draft front and opening back", async () => {
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Unsaved front");
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("Back text");
  });
});

test("PLAYWRIGHT-CARD-FORM-22 focuses the invalid front before the invalid back", async ({ page }) => {
  await test.step("Given: both sides cleared while Back is active", async () => {
    await open(page, domain, "edit");
    await page.getByRole("textbox", { name: "Front text" }).fill("");
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill("");
  });
  await test.step("When: save", () => page.getByRole("button", { name: "Save changes", exact: true }).click());
  await test.step("Then: focus Front and expose both required errors without persistence", async () => {
    await expect(page.getByRole("textbox", { name: "Front text" })).toBeFocused();
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveAccessibleDescription(
      "Front text is required."
    );
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveAccessibleDescription(
      "Back text is required."
    );
    expect(await requests(page)).toEqual([]);
  });
});

test("PLAYWRIGHT-CARD-FORM-23 preserves a failed edit and explicitly retries the same content", async ({ page }) => {
  await test.step("Given: a failing first save", () => open(page, domain, "edit-retry"));
  await test.step("When: save an edited front", async () => {
    await page.getByRole("textbox", { name: "Front text" }).fill("Retry front");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
  });
  await test.step("Then: retain editable content and show failure without success", async () => {
    await expect(page.getByRole("alert")).toContainText("Unable to save changes. Try again.");
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Retry front");
    await expect(page.getByRole("textbox", { name: "Front text" })).toBeEnabled();
    await expect(page.getByRole("heading", { name: "Edit card", exact: true })).toBeVisible();
  });
  await test.step("When: retry", () => page.getByRole("button", { name: "Save changes", exact: true }).click());
  await test.step("Then: save the same content and complete once", async () => {
    await expect(page.getByRole("button", { name: "View Retry front", exact: true })).toBeVisible();
    const writes = await requests(page);
    expect(writes).toHaveLength(2);
    expect(writes).toMatchObject([
      { input: { id: "form-card", frontText: "Retry front", backText: "Back text" } },
      { input: { id: "form-card", frontText: "Retry front", backText: "Back text" } },
    ]);
  });
});

test("PLAYWRIGHT-CARD-FORM-24 edits tag drafts directly without confirmation", async ({ page }) => {
  await test.step("Given: two selected tags", () => open(page, domain, "edit"));
  await test.step("When: rename the first and remove the second", async () => {
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await page.getByRole("textbox", { name: "Tag name 1" }).fill("renamed");
  });
  await test.step("Then: retain name focus and value", async () => {
    await expect(page.getByRole("textbox", { name: "Tag name 1" })).toBeFocused();
    await expect(page.getByRole("textbox", { name: "Tag name 1" })).toHaveValue("renamed");
  });
  await test.step("When: remove the second tag", () => page.getByRole("button", { name: "Remove tag 2" }).click());
  await test.step("Then: remove its input", () =>
    expect(page.getByRole("textbox", { name: "Tag name 2" })).toHaveCount(0));
  await test.step("When: add a new second tag", async () => {
    await page.getByRole("button", { name: "Add tag", exact: true }).click();
    await page.getByRole("textbox", { name: "Tag name 2" }).fill("new");
  });
  await test.step("Then: require no alert or extra confirmation and do not save", async () => {
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^(Done|OK|Confirm)$/ })).toHaveCount(0);
    expect(await requests(page)).toEqual([]);
  });
  await test.step("When: close and reopen tag editing", async () => {
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await expect(page.getByRole("button", { name: "Edit tags", exact: true })).toHaveAccessibleDescription(
      "renamed, new"
    );
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
  });
  await test.step("Then: retain both edited names without a toast", async () => {
    await expect(page.getByRole("textbox", { name: "Tag name 1" })).toHaveValue("renamed");
    await expect(page.getByRole("textbox", { name: "Tag name 2" })).toHaveValue("new");
    await expect(page.getByRole("status", { name: "Toast notifications" })).toBeEmpty();
  });
  await test.step("When: close and save the card", async () => {
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
  });
  await test.step("Then: submit the edited tag order and original sides", async () => {
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
    expect(await requests(page)).toMatchObject([
      { input: { frontText: "Front", backText: "Back", tags: ["renamed", "new"] } },
    ]);
  });
});

for (const corrected of ["new", " new tag "]) {
  test(`PLAYWRIGHT-CARD-FORM-25 rejects blank and duplicate tags until ${JSON.stringify(corrected)} correction`, async ({
    page,
  }) => {
    await test.step("Given: a third tag input", async () => {
      await open(page, domain, "edit");
      await page.getByRole("button", { name: "Edit tags", exact: true }).click();
      await page.getByRole("button", { name: "Add tag", exact: true }).click();
    });
    for (const [value, message] of [
      [" ", "Tag name is required."],
      ["custom", "Tag names must be unique."],
      [" custom ", "Tag names must be unique."],
    ]) {
      await test.step(`When: enter invalid tag ${JSON.stringify(value)}`, async () => {
        await page.getByRole("textbox", { name: "Tag name 3" }).fill(value!);
        await page.keyboard.press("Tab");
      });
      await test.step("Then: expose the tag validation", () =>
        expect(page.getByRole("textbox", { name: "Tag name 3" })).toHaveAccessibleDescription(message!));
      await test.step("When: close and try saving", async () => {
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Save changes", exact: true }).click();
      });
      await test.step("Then: remain editing without persistence", async () => {
        await expect(page.getByRole("heading", { name: "Edit card", exact: true })).toBeVisible();
        expect(await requests(page)).toEqual([]);
        await page.getByRole("button", { name: "Edit tags", exact: true }).click();
      });
    }
    await test.step("When: correct the tag and save", async () => {
      await page.getByRole("textbox", { name: "Tag name 3" }).fill(corrected);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("alert")).toHaveCount(0);
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
    });
    await test.step("Then: trim only edge spaces and save the corrected tags", async () => {
      await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
      const row = page
        .getByRole("article")
        .filter({ has: page.getByRole("button", { name: "View Front", exact: true }) });
      await expect(row.getByText(corrected.trim(), { exact: true })).toBeVisible();
      expect(await requests(page)).toMatchObject([
        { input: { frontText: "Front", backText: "Back", tags: ["language", "custom", corrected.trim()] } },
      ]);
    });
  });
}

test("PLAYWRIGHT-CARD-EDIT-01 reaches overflowing preview before other controls", async ({ page }) => {
  await test.step("Given: a long raw answer", () => open(page, domain, "long"));
  await test.step("When: open Back preview and press Tab", async () => {
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Preview answer", exact: true }).click();
    await page.keyboard.press("Tab");
  });
  await test.step("Then: focus the overflowing preview", async () => {
    const preview = page.getByRole("region", { name: "Answer preview" });
    await expect(preview).toBeFocused();
    expect(await preview.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  });
});

for (const width of [1280, 812]) {
  test(`PLAYWRIGHT-CARD-EDIT-02 keeps focus in expanded editing at width ${width}`, async ({ page }) => {
    await test.step("Given: expanded Back with preview closed", async () => {
      await page.setViewportSize({ width, height: 800 });
      await open(page, domain, "long");
      await page.getByRole("tab", { name: "Back", exact: true }).click();
      await page.getByRole("button", { name: "Expand Back" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Preview answer", exact: true }).focus();
    });
    await test.step("When: press Tab", () => page.keyboard.press("Tab"));
    await test.step("Then: focus Done", () =>
      expect(page.getByRole("dialog").getByRole("button", { name: "Done", exact: true })).toBeFocused());
    await test.step("When: press Shift+Tab", () => page.keyboard.press("Shift+Tab"));
    await test.step("Then: return to the preview trigger", () =>
      expect(page.getByRole("dialog").getByRole("button", { name: "Preview answer", exact: true })).toBeFocused());
    await test.step("When: finish expanded editing with Done", () =>
      page.getByRole("dialog").getByRole("button", { name: "Done", exact: true }).click());
    await test.step("Then: close the dialog and restore the expansion trigger focus", async () => {
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Expand Back", exact: true })).toBeFocused();
    });
  });
}

test("PLAYWRIGHT-CARD-EDIT-03 protects the draft and traps leave-dialog focus", async ({ page }) => {
  await test.step("Given: a dirty existing card", async () => {
    await open(page, domain, "edit");
    await page.getByRole("textbox", { name: "Front text" }).fill("Unsaved front");
  });
  const leave = page.getByRole("button", { name: "tango", exact: true });
  const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
  const keep = dialog.getByRole("button", { name: "Keep editing" });
  const discard = dialog.getByRole("button", { name: "Discard changes" });
  await test.step("When: attempt to leave", () => leave.click());
  await test.step("Then: focus Keep editing", () => expect(keep).toBeFocused());
  for (const [key, target] of [
    ["Tab", discard],
    ["Tab", keep],
    ["Shift+Tab", discard],
    ["Shift+Tab", keep],
  ] as const) {
    await test.step(`When: press ${key}`, () => page.keyboard.press(key));
    await test.step("Then: cycle focus within the dialog", () => expect(target).toBeFocused());
  }
  await test.step("When: dismiss with Escape", () => page.keyboard.press("Escape"));
  await test.step("Then: restore trigger focus and preserve the editor and draft", async () => {
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/card\/form-card\/edit$/);
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Unsaved front");
    await expect(leave).toBeFocused();
  });
  await test.step("When: reopen and Keep editing", async () => {
    await leave.click();
    await keep.click();
  });
  await test.step("Then: retain the draft", () =>
    expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Unsaved front"));
  await test.step("When: reopen and discard changes", async () => {
    await leave.click();
    await discard.click();
  });
  await test.step("Then: return to Deck list and retain original saved content", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: "Open cards in Japanese verbs", exact: true })).toBeVisible();
    expect(await requests(page)).toEqual([]);
    await page.getByRole("button", { name: "Open cards in Japanese verbs", exact: true }).click();
    await page.getByRole("button", { name: "Open actions for Front", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Front");
  });
});

test("PLAYWRIGHT-CARD-CREATE-03 confirms dirty cancellation and discards only the draft", async ({ page }) => {
  await test.step("Given: a changed creation form", async () => {
    await open(page, domain, "create");
    await page.getByRole("textbox", { name: "Front text" }).fill("Unsaved front");
  });
  await test.step("When: cancel and Keep editing", async () => {
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  });
  await test.step("Then: retain the front draft", () =>
    expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Unsaved front"));
  await test.step("When: cancel and discard changes", async () => {
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  });
  await test.step("Then: return to the target deck without creating", async () => {
    await expect(page).toHaveURL(/\/deck\/form-deck$/);
    await expect(page.getByRole("button", { name: "View Unsaved front", exact: true })).toHaveCount(0);
    expect(await requests(page)).toEqual([]);
  });
});

test("PLAYWRIGHT-CARD-CREATE-04 cancels a clean creation without confirmation", async ({ page }) => {
  await test.step("Given: an unchanged creation form", () => open(page, domain, "create"));
  await test.step("When: cancel", () => page.getByRole("button", { name: "Cancel", exact: true }).click());
  await test.step("Then: return directly to the target deck", async () => {
    await expect(page).toHaveURL(/\/deck\/form-deck$/);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect(await requests(page)).toEqual([]);
  });
});

test("PLAYWRIGHT-CARD-CREATE-08 completes a pending creation over an unanswered leave confirmation", async ({
  page,
}) => {
  await test.step("Given: a pending creation", async () => {
    await open(page, domain, "create-pending");
    await fill(page, "Pending front", "Pending back");
    await page.getByRole("button", { name: "Create card", exact: true }).click();
    await expect(page.getByRole("button", { name: "Creating…", exact: true })).toBeDisabled();
  });
  await test.step("When: attempt Header departure", async () => {
    await page.getByRole("button", { name: "tango", exact: true }).click();
  });
  await test.step("Then: explain how the pending creation completes", () =>
    expect(page.getByRole("alertdialog")).toContainText(
      "Card creation is in progress and will continue if you leave. You will be taken to the card list when it succeeds, or see a notification if it fails."
    ));
  await test.step("When: Keep editing", () => page.getByRole("button", { name: "Keep editing", exact: true }).click());
  await test.step("Then: retain the pending draft and route", async () => {
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("Pending back");
    await expect(page).toHaveURL(/\/deck\/form-deck\/card\/new$/);
  });
  await test.step("When: attempt Header departure again without answering", () =>
    page.getByRole("button", { name: "tango", exact: true }).click());
  await test.step("Then: retain the unanswered leave confirmation", () =>
    expect(page.getByRole("alertdialog")).toBeVisible());
  await test.step("When: receive the successful external response", () => command(page, "finish"));
  await test.step("Then: close confirmation, show the saved card once, and announce success", async () => {
    await expect(page).toHaveURL(/\/deck\/form-deck$/);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "View Pending front", exact: true })).toHaveCount(1);
    await expect(page.getByRole("status", { name: "Toast notifications" })).toContainText(
      "Created card “Pending front”."
    );
    expect(await requests(page)).toHaveLength(1);
  });
});

test("PLAYWRIGHT-CARD-CREATE-09 keeps the current screen after a background creation succeeds", async ({ page }) => {
  await test.step("Given: a pending creation", async () => {
    await open(page, domain, "create-pending");
    await fill(page, "Background front", "Pending back");
    await page.getByRole("button", { name: "Create card", exact: true }).click();
    await expect(page.getByRole("button", { name: "Creating…", exact: true })).toBeDisabled();
  });
  await test.step("When: explicitly leave the pending form", async () => {
    await page.getByRole("button", { name: "tango", exact: true }).click();
    await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  });
  await test.step("Then: reach Deck list", () => expect(page).toHaveURL(/\/$/));
  await test.step("When: complete the background external response", () => command(page, "finish"));
  await test.step("Then: retain the current route without stale creation feedback", async () => {
    await expect
      .poll(() =>
        command<{ cards: { frontText: string }[] }>(page, "readData").then((value) =>
          value.cards.some((card) => card.frontText === "Background front")
        )
      )
      .toBe(true);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("status", { name: "Toast notifications" })).not.toContainText(
      "Created card “Background front”."
    );
  });
  await test.step("When: open the target deck", () =>
    page.getByRole("button", { name: "Open cards in Japanese verbs", exact: true }).click());
  await test.step("Then: the completed card is available once", () =>
    expect(page.getByRole("button", { name: "View Background front", exact: true })).toHaveCount(1));
});

test("PLAYWRIGHT-CARD-CREATE-10 retains a pending leave dialog through rejection and retry", async ({ page }) => {
  await test.step("Given: both creation sides with a held first response", async () => {
    await open(page, domain, "create-pending-retry");
    await fill(page, "Rejected front", "Pending back");
  });
  await test.step("When: initiate saving then open Header leave confirmation", async () => {
    await page.getByRole("button", { name: "Create card", exact: true }).click();
    await expect(page.getByRole("button", { name: "Creating…", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "tango", exact: true }).click();
  });
  await test.step("Then: show the unanswered confirmation", () => expect(page.getByRole("alertdialog")).toBeVisible());
  await test.step("When: reject the pending external write", () => command(page, "fail"));
  await test.step("Then: keep the confirmation and show failure without success navigation", async () => {
    await expect(page.getByRole("alert")).toContainText("Unable to create this card. Try again.");
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page).toHaveURL(/\/deck\/form-deck\/card\/new$/);
  });
  await test.step("When: Keep editing", () => page.getByRole("button", { name: "Keep editing", exact: true }).click());
  await test.step("Then: retain both inputs", async () => {
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("Pending back");
    await page.getByRole("tab", { name: "Front", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Rejected front");
  });
  await test.step("When: retry", () => page.getByRole("button", { name: "Create card", exact: true }).click());
  await test.step("Then: show one created card and success", async () => {
    await expect(page).toHaveURL(/\/deck\/form-deck$/);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "View Rejected front", exact: true })).toHaveCount(1);
    await expect(page.getByRole("status", { name: "Toast notifications" })).toContainText(
      "Created card “Rejected front”."
    );
    expect(await requests(page)).toHaveLength(2);
  });
});

test("PLAYWRIGHT-CARD-EDIT-16 shows tab and expanded errors while preserving saved data", async ({ page }) => {
  let before: unknown;
  await test.step("Given: an existing card", async () => {
    await open(page, domain, "edit");
    before = await command(page, "readData");
  });
  await test.step("When: clear both sides and save while Back is active", async () => {
    await fill(page, "", "");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
  });
  await test.step("Then: select and focus the first invalid side, with both tabs described", async () => {
    const front = page.getByRole("tab", { name: "Front", exact: true });
    const back = page.getByRole("tab", { name: "Back", exact: true });
    await expect(front).toHaveAttribute("aria-selected", "true");
    await expect(front.getByText("●", { exact: true })).toBeVisible();
    await expect(back.getByText("●", { exact: true })).toBeVisible();
    await expect(front).toHaveAccessibleDescription("Front text is required.");
    await expect(back).toHaveAccessibleDescription("Back text is required.");
    await expect(page.getByRole("textbox", { name: "Front text" })).toBeFocused();
    await expect(page.getByText("Front text is required.", { exact: true })).toBeVisible();
  });
  await test.step("When: switch to Back", () => page.getByRole("tab", { name: "Back", exact: true }).click());
  await test.step("Then: display the Back error", () =>
    expect(page.getByText("Back text is required.", { exact: true })).toBeVisible());
  await test.step("When: expand Back", () => page.getByRole("button", { name: "Expand Back", exact: true }).click());
  await test.step("Then: expose the same accessible invalid field", async () => {
    const dialog = page.getByRole("dialog", { name: "Back text", exact: true });
    await expect(dialog.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByRole("textbox")).toHaveAccessibleDescription("Back text is required.");
    await expect(dialog.getByText("Back text is required.", { exact: true })).toBeVisible();
  });
  await test.step("When: close the expanded editor", () =>
    page.getByRole("dialog").getByRole("button", { name: "Done", exact: true }).click());
  await test.step("Then: retain the empty draft and all saved state", async () => {
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("");
    expect(await command(page, "readData")).toEqual(before);
    expect(await requests(page)).toEqual([]);
  });
});

test("PLAYWRIGHT-CARD-EDIT-17 discards tag drafts and restores the original names on reopening", async ({ page }) => {
  let before: unknown;
  await test.step("Given: a saved card with two tags", async () => {
    await open(page, domain, "tag-validation");
    before = await command(page, "readData");
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
  });
  await test.step("When: rename, remove, add, and discard tag drafts", async () => {
    await page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill("draft");
    await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
    await page.getByRole("button", { name: "Add tag", exact: true }).click();
    await page.getByRole("textbox", { name: "Tag name 2", exact: true }).fill("unsaved");
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await page.getByRole("button", { name: "tango", exact: true }).click();
    await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  });
  await test.step("Then: navigation preserves saved state", async () => {
    await expect(page).toHaveURL(/\/$/);
    expect(await command(page, "readData")).toEqual(before);
    expect(await requests(page)).toEqual([]);
  });
  await test.step("When: reopen the card and tag editor", async () => {
    await page.getByRole("button", { name: "Open cards in Japanese verbs", exact: true }).click();
    await page.getByRole("button", { name: "Open actions for Front", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
  });
  await test.step("Then: restore original names", async () => {
    await expect(page.getByRole("textbox", { name: "Tag name 1", exact: true })).toHaveValue("shared");
    await expect(page.getByRole("textbox", { name: "Tag name 2", exact: true })).toHaveValue("kept");
  });
});

for (const invalid of [" ", "kept", " kept "]) {
  test(`PLAYWRIGHT-CARD-FORM-25 rejects renamed tag ${JSON.stringify(invalid)}`, async ({ page }) => {
    let before: unknown;
    await test.step("Given: two saved tags", async () => {
      await open(page, domain, "tag-validation");
      before = await command(page, "readData");
      await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    });
    await test.step("When: rename the first to an invalid value and leave the input", async () => {
      await page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill(invalid);
      await page.keyboard.press("Tab");
    });
    await test.step("Then: show the matching validation error", () =>
      expect(page.getByRole("alert")).toContainText(
        invalid === " " ? "Tag name is required." : "Tag names must be unique."
      ));
    await test.step("When: try to save", async () => {
      await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
    });
    await test.step("Then: remain editing with unchanged saved tags", async () => {
      await expect(page).toHaveURL(/\/card\/form-card\/edit$/);
      expect(await command(page, "readData")).toEqual(before);
      expect(await requests(page)).toEqual([]);
    });
    await test.step("When: correct the first name and save", async () => {
      await page.getByRole("button", { name: "Edit tags", exact: true }).click();
      await page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill("corrected");
      await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
    });
    await test.step("Then: save corrected names in order", async () => {
      await expect(page).toHaveURL(/\/deck\/form-deck$/);
      expect(await requests(page)).toMatchObject([{ input: { tags: ["corrected", "kept"] } }]);
    });
  });
}

for (const unknown of [false, true]) {
  test(`PLAYWRIGHT-CARD-EDIT-18 updates ${unknown ? "unknown" : "required"} errors on a system language event`, async ({
    page,
  }) => {
    let before: unknown;
    let url: string;
    await test.step("Given: System language, English required error, and an unsaved Japanese back", async () => {
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "language", { configurable: true, get: () => "en-US" })
      );
      await open(page, domain, unknown ? "system-unknown" : "system-language");
      before = await command(page, "readData");
      url = page.url();
      await fill(page, unknown ? "Front" : "", "未保存の回答");
      await page.getByRole("tab", { name: "Front", exact: true }).click();
      if (!unknown) await page.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(page.getByRole("textbox", { name: "Front text" })).toHaveAccessibleDescription(
        unknown ? "The value is invalid." : "Front text is required."
      );
    });
    await test.step("When: browser language changes to Japanese", () =>
      page.evaluate(() => {
        Object.defineProperty(navigator, "language", { configurable: true, get: () => "ja-JP" });
        window.dispatchEvent(new Event("languagechange"));
      }));
    await test.step("Then: translate the existing error and keep the empty front", async () => {
      await expect(page.locator("html")).toHaveAttribute("lang", "ja");
      await expect(page.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
        unknown ? "入力内容が正しくありません。" : "表面のテキストは必須です。"
      );
      await expect(page.getByRole("textbox", { name: "表面のテキスト" })).toHaveValue(unknown ? "Front" : "");
    });
    await test.step("When: open the translated Back tab", () =>
      page.getByRole("tab", { name: "裏面", exact: true }).click());
    await test.step("Then: preserve the answer, route, saved Card/Deck, and study state", async () => {
      await expect(page.getByRole("textbox", { name: "裏面のテキスト" })).toHaveValue("未保存の回答");
      await expect(page).toHaveURL(url!);
      expect(await command(page, "readData")).toEqual(before);
      expect(await requests(page)).toEqual([]);
    });
    await test.step("When: attempt to open Settings", () =>
      page.getByRole("button", { name: "設定を開く", exact: true }).click());
    await test.step("Then: protect the unsaved draft with the translated guard", () =>
      expect(page.getByRole("alertdialog", { name: "未保存の変更を破棄しますか？" })).toBeVisible());
  });
}

test("PLAYWRIGHT-CARD-CREATE-05 previews an incomplete mobile draft without saving and preserves native undo", async ({
  page,
}) => {
  let before: unknown;
  let url: string;
  await test.step("Given: an incomplete anonymous creation at mobile width", async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, domain, "create-preview");
    before = await command(page, "readData");
    url = page.url();
    await expect(page.getByRole("heading", { name: "Create card", exact: true })).toBeVisible();
  });
  const input = page.getByRole("textbox", { name: "Back text", exact: true });
  const preview = page.getByRole("region", { name: "Answer preview", exact: true });
  const trigger = page.getByRole("button", { name: "Preview answer", exact: true });
  await test.step("When: enter multiline back text and preview with Enter", async () => {
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await input.fill("First line\nSecond line");
    await trigger.focus();
    await page.keyboard.press("Enter");
  });
  await test.step("Then: preserve both text lines", () =>
    expect(preview.locator("pre")).toHaveText("First line\nSecond line"));
  await test.step("When: close with Enter", () => page.keyboard.press("Enter"));
  await test.step("Then: restore preview trigger focus", async () => {
    await expect(preview).toBeHidden();
    await expect(trigger).toBeFocused();
  });
  await test.step("When: type, open and close preview, and undo", async () => {
    await input.fill("");
    await input.press("x");
    await trigger.click();
    await page.getByRole("button", { name: "Hide preview", exact: true }).click();
    await input.focus();
    await input.press("ControlOrMeta+z");
  });
  await test.step("Then: native undo restores empty input", () => expect(input).toHaveValue(""));
  await test.step("When: enter math, add its tag and preview", async () => {
    await input.fill("**Draft answer**\n\n$x^2$\n\n| A | B |\n| - | - |\n| 1 | 2 |");
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await page.getByRole("button", { name: "Add tag", exact: true }).click();
    await page.getByRole("textbox", { name: "Tag name 1", exact: true }).fill("math");
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await trigger.click();
  });
  await test.step("Then: show strong, math, and table", async () => {
    await expect(preview.locator("strong")).toHaveText("Draft answer");
    await expect(preview.locator(".katex")).toBeVisible();
    await expect(preview.getByRole("table")).toBeVisible();
  });
  await test.step("When: expand, change the answer, and preview using Enter", async () => {
    await page.getByRole("button", { name: "Expand Back", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Back text", exact: true })
      .getByRole("textbox")
      .fill("**Expanded draft**\n\n$y^2$");
    await page.getByRole("dialog").getByRole("button", { name: "Preview answer", exact: true }).press("Enter");
  });
  await test.step("Then: show the expanded draft", () =>
    expect(page.getByRole("dialog").getByRole("region").locator("strong")).toHaveText("Expanded draft"));
  await test.step("When: close expanded editing with Escape", () => page.keyboard.press("Escape"));
  await test.step("Then: synchronize inline draft and preview without errors, navigation, or saved changes", async () => {
    await expect(input).toHaveValue("**Expanded draft**\n\n$y^2$");
    await expect(preview.locator("strong")).toHaveText("Expanded draft");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page).toHaveURL(url!);
    expect(await command(page, "readData")).toEqual(before);
    expect(await requests(page)).toEqual([]);
  });
});

test("PLAYWRIGHT-CARD-EDIT-04 previews changing language tags and preserves expanded native undo", async ({ page }) => {
  let before: unknown;
  let url: string;
  await test.step("Given: an anonymous existing card with an unsaved answer", async () => {
    await open(page, domain, "edit");
    before = await command(page, "readData");
    url = page.url();
    await expect(page.getByRole("heading", { name: "Edit card", exact: true })).toBeVisible();
  });
  const input = page.getByRole("textbox", { name: "Back text", exact: true });
  const preview = page.getByRole("region", { name: "Answer preview", exact: true });
  await test.step("When: type in ordinary editing, toggle preview, and undo", async () => {
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await input.fill("");
    await input.press("x");
    await page.getByRole("button", { name: "Preview answer", exact: true }).click();
    await page.getByRole("button", { name: "Hide preview", exact: true }).click();
    await input.focus();
    await input.press("ControlOrMeta+z");
  });
  await test.step("Then: preserve native undo in ordinary editing", () => expect(input).toHaveValue(""));
  await test.step("When: enter TypeScript and select its tag", async () => {
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await input.fill("const answer = 42;");
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await page.getByRole("checkbox", { name: "typescript", exact: true }).locator("xpath=parent::label").click();
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await page.getByRole("button", { name: "Preview answer", exact: true }).click();
  });
  await test.step("Then: highlight TypeScript with the current theme", async () => {
    await expect(preview.locator("code")).toHaveAttribute("data-language", "typescript");
    await expect(preview.locator(".hljs-keyword")).toHaveText("const");
    const dark = await page.locator("html").evaluate((element) => element.classList.contains("dark"));
    await expect(preview.locator("code")).toHaveAttribute("data-theme", dark ? "dark" : "light");
  });
  await test.step("When: change the selected language to Markdown source", async () => {
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await page.getByRole("checkbox", { name: "typescript", exact: true }).locator("xpath=parent::label").click();
    await page.getByRole("checkbox", { name: "md", exact: true }).locator("xpath=parent::label").click();
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await input.fill("**Markdown source** $x^2$");
  });
  await test.step("Then: keep Markdown as code without math", async () => {
    await expect(preview.locator("code")).toHaveAttribute("data-language", "md");
    await expect(preview.locator(".katex")).toHaveCount(0);
  });
  await test.step("When: change the selected language to Python", async () => {
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await page.getByRole("checkbox", { name: "md", exact: true }).locator("xpath=parent::label").click();
    await page.getByRole("checkbox", { name: "python", exact: true }).locator("xpath=parent::label").click();
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await input.fill("def draft():\n    return 42");
  });
  await test.step("Then: highlight the changed Python function", async () => {
    await expect(preview.locator("code")).toHaveAttribute("data-language", "python");
    await expect(preview.locator(".hljs-title")).toHaveText("draft");
  });
  await test.step("When: expand, type, toggle preview, and undo", async () => {
    await page.getByRole("button", { name: "Expand Back", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Back text", exact: true });
    const expanded = dialog.getByRole("textbox");
    await expanded.fill("");
    await expanded.press("x");
    await dialog.getByRole("button", { name: "Preview answer", exact: true }).press("Enter");
    await dialog.getByRole("button", { name: "Hide preview", exact: true }).press("Enter");
    await expanded.focus();
    await expanded.press("ControlOrMeta+z");
  });
  await test.step("Then: retain native undo history", () =>
    expect(page.getByRole("dialog").getByRole("textbox")).toHaveValue(""));
  await test.step("When: enter updated Python and reopen expanded preview", async () => {
    await page.getByRole("dialog").getByRole("textbox").fill("def updated():\n    return 43");
    await page.getByRole("dialog").getByRole("button", { name: "Preview answer", exact: true }).press("Enter");
  });
  await test.step("Then: highlight the updated function name", () =>
    expect(page.getByRole("dialog").getByRole("region").locator(".hljs-title")).toHaveText("updated"));
  await test.step("When: close expanded editing", () => page.keyboard.press("Escape"));
  await test.step("Then: keep inline input, preview, and route synchronized", async () => {
    await expect(input).toHaveValue("def updated():\n    return 43");
    await expect(preview.locator(".hljs-title")).toHaveText("updated");
    await expect(page).toHaveURL(url!);
  });
  await test.step("When: attempt Header departure", () =>
    page.getByRole("button", { name: "tango", exact: true }).click());
  await test.step("Then: still guard unsaved changes", () => expect(page.getByRole("alertdialog")).toBeVisible());
  await test.step("When: Keep editing", () => page.getByRole("button", { name: "Keep editing", exact: true }).click());
  await test.step("Then: retain the latest draft without saved changes", async () => {
    await expect(input).toHaveValue("def updated():\n    return 43");
    await expect(page.getByRole("button", { name: "Edit tags", exact: true })).toHaveAccessibleDescription(
      "language, custom, python"
    );
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(await command(page, "readData")).toEqual(before);
    expect(await requests(page)).toEqual([]);
  });
});

test("PLAYWRIGHT-CARD-EDIT-06 PLAYWRIGHT-CARD-EDIT-07 PLAYWRIGHT-CARD-EDIT-08 preserves raw tag drafts until save and removes unblurred candidates", async ({
  page,
}) => {
  let before: { cards: Card[]; decks: unknown[]; study: string | null };
  const changed = { frontText: "Edited front", backText: "Edited back" };
  const name = page.getByRole("textbox", { name: "Tag name 1", exact: true });
  const addTag = async (value: string) => {
    await page.getByRole("button", { name: "Add tag", exact: true }).click();
    await page
      .getByRole("textbox", { name: /^Tag name / })
      .last()
      .fill(value);
  };
  await test.step("Given: a saved card and unchanged neighboring cards", async () => {
    await open(page, domain, "tag-validation");
    before = await command(page, "readData");
  });
  await test.step("When: edit both sides and type the last character of a tag rename", async () => {
    await fill(page, changed.frontText, changed.backText);
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await name.fill("rename");
    await name.press("d");
  });
  await test.step("Then: preserve typing focus and the renamed value", async () => {
    await expect(name).toBeFocused();
    await expect(name).toHaveValue("renamed");
  });
  await test.step("When: add surrounding spaces", () => name.fill(" renamed "));
  await test.step("Then: preserve whitespace while editing", () => expect(name).toHaveValue(" renamed "));
  await test.step("When: press Enter in the tag input", () => name.press("Enter"));
  await test.step("Then: preserve the focused raw draft and do not submit the Card", async () => {
    await expect(name).toBeFocused();
    await expect(name).toHaveValue(" renamed ");
    await expect(page).toHaveURL(/\/card\/form-card\/edit$/);
    expect(await command(page, "readData")).toEqual(before!);
    expect(await requests(page)).toEqual([]);
  });
  await test.step("When: close tag editing", () =>
    page.getByRole("button", { name: "Close tag editor", exact: true }).click());
  await test.step("Then: retain the back draft", () =>
    expect(page.getByRole("textbox", { name: "Back text", exact: true })).toHaveValue(changed.backText));
  await test.step("When: switch to Front", () => page.getByRole("tab", { name: "Front", exact: true }).click());
  await test.step("Then: retain the front draft", () =>
    expect(page.getByRole("textbox", { name: "Front text", exact: true })).toHaveValue(changed.frontText));
  await test.step("When: reopen tags and remove the second tag", async () => {
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
  });
  await test.step("Then: leave one tag input", () =>
    expect(page.getByRole("textbox", { name: /^Tag name / })).toHaveCount(1));
  await test.step("When: add an unblurred duplicate and click its candidate", async () => {
    await addTag(" renamed ");
    await page.locator('label:has(input[type="checkbox"][value=" renamed "])').click();
  });
  await test.step("Then: remove only the duplicate and retain the normalized original", async () => {
    await expect(page.getByRole("textbox", { name: /^Tag name / })).toHaveCount(1);
    await expect(name).toHaveValue("renamed");
  });
  await test.step("When: add a new tag", () => addTag(" new tag "));
  await test.step("Then: focus its input", () =>
    expect(page.getByRole("textbox", { name: "Tag name 2", exact: true })).toBeFocused());
  await test.step("When: immediately remove it through the candidate label", () =>
    page.getByRole("dialog").getByText("new tag", { exact: true }).click());
  await test.step("Then: remove its row", () =>
    expect(page.getByRole("textbox", { name: /^Tag name / })).toHaveCount(1));
  await test.step("When: add it again", () => addTag(" new tag "));
  await test.step("Then: do not save or ask for extra confirmation", async () => {
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect(await command(page, "readData")).toEqual(before!);
    expect(await requests(page)).toEqual([]);
  });
  await test.step("When: save the Card", async () => {
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
  });
  await test.step("Then: save only this Card's edited sides and normalized tag order", async () => {
    await expect(page).toHaveURL(/\/deck\/form-deck$/);
    expect(await requests(page)).toMatchObject([
      { input: { id: "form-card", ...changed, tags: ["renamed", "new tag"] } },
    ]);
    const after = await command<typeof before>(page, "readData");
    expect(after.cards).toEqual(
      before!.cards.map((card) =>
        card.id === "form-card" ? { ...card, ...changed, tags: ["renamed", "new tag"] } : card
      )
    );
    expect(after.decks).toEqual(before!.decks);
    expect(after.study).toEqual(before!.study);
  });
});

test("PLAYWRIGHT-CARD-CREATE-06 PLAYWRIGHT-CARD-EDIT-05 fits expanded editors and scopes tag candidates in create and edit", async ({
  page,
}) => {
  const viewport = { width: 390, height: 844 };
  const viewportBounds = { x: 0, y: 0, ...viewport };
  const frontText = "CARD-MANAGEMENT-05 remote front";
  const backText = "CARD-MANAGEMENT-05 remote back";
  await test.step("Given: a linked account, same-deck chapter tag, and other-deck python tag at 390 by 844", async () => {
    await page.setViewportSize(viewport);
    await open(page, domain, "create-mobile");
    await expect(page).toHaveURL(/\/deck\/form-deck\/card\/new$/);
  });
  for (const { side, value } of [
    { side: "Front", value: frontText },
    { side: "Back", value: backText },
  ]) {
    await test.step(`When: expand ${side}`, async () => {
      await page.getByRole("tab", { name: side, exact: true }).click();
      await page.getByRole("button", { name: `Expand ${side}`, exact: true }).click();
    });
    await test.step(`Then: the ${side} editor and backdrop fill the viewport`, async () => {
      const editor = page.getByRole("dialog", { name: `${side} text`, exact: true });
      await expect(editor).toBeVisible();
      await expect(editor.getByRole("heading", { name: `${side} text`, exact: true })).toBeVisible();
      await expect(editor.getByRole("button", { name: "Done", exact: true })).toBeVisible();
      expect(await editor.boundingBox()).toEqual(viewportBounds);
      expect(await page.getByTestId("card-fields-backdrop").boundingBox()).toEqual(viewportBounds);
    });
    await test.step(`When: enter ${side} and finish expanded editing`, async () => {
      const editor = page.getByRole("dialog", { name: `${side} text`, exact: true });
      await editor.getByRole("textbox", { name: `${side} text`, exact: true }).fill(value);
      await editor.getByRole("button", { name: "Done", exact: true }).click();
    });
    await test.step(`Then: preserve the ${side} draft`, () =>
      expect(page.getByRole("textbox", { name: `${side} text`, exact: true })).toHaveValue(value));
  }
  const tags = page.getByRole("dialog", { name: "Select tags", exact: true });
  await test.step("When: open tag selection", () =>
    page.getByRole("button", { name: "Edit tags", exact: true }).click());
  await test.step("Then: align tag selection with the viewport bottom and exclude the other deck's tag", async () => {
    await expect(tags).toBeVisible();
    expect(await page.getByTestId("card-fields-backdrop").boundingBox()).toEqual(viewportBounds);
    const bounds = await tags.boundingBox();
    if (bounds === null) throw new Error("Tag selection dialog has no rendered bounds");
    expect(bounds.y + bounds.height).toBe(viewport.height);
    await expect(tags.getByRole("checkbox", { name: "python", exact: true })).toHaveCount(0);
  });
  await test.step("When: select the same-deck tag, add a trimmed custom tag, and double-click Create card", async () => {
    await tags.getByRole("checkbox", { name: "chapter-1", exact: true }).locator("xpath=parent::label").click();
    await tags.getByRole("button", { name: "Add tag", exact: true }).click();
    await tags.getByRole("textbox", { name: "Tag name 2", exact: true }).fill(" new tag ");
    await tags.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await page.getByRole("button", { name: "Create card", exact: true }).dblclick();
  });
  await test.step("Then: prevent another creation while the external write is pending", async () => {
    await expect(page.getByRole("button", { name: "Creating…", exact: true })).toBeDisabled();
    expect(await requests(page)).toHaveLength(1);
  });
  await test.step("When: the external write succeeds and returns the created Card", () => command(page, "finish"));
  await test.step("Then: list one created Card with both sides, normalized tags, and success feedback", async () => {
    await expect(page).toHaveURL(/\/deck\/form-deck$/);
    await expect(page.getByRole("status").filter({ hasText: `Created card “${frontText}”.` })).toBeVisible();
    await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toHaveCount(1);
    expect(await requests(page)).toMatchObject([
      {
        kind: "create",
        uid: "playwright-user",
        input: { deckId: "form-deck", frontText, backText, tags: ["chapter-1", "new tag"] },
      },
    ]);
    const row = page
      .getByRole("article")
      .filter({ has: page.getByRole("button", { name: `View ${frontText}`, exact: true }) });
    await expect(row.getByText("chapter-1", { exact: true })).toBeVisible();
    await expect(row.getByText("new tag", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: `View ${frontText}`, exact: true }).click();
    await expect(page.getByRole("dialog", { name: frontText, exact: true })).toContainText(backText);
  });
  await test.step("When: reopen the created Card in its real editor and open tag selection", async () => {
    await page
      .getByRole("dialog", { name: frontText, exact: true })
      .getByRole("button", { name: "Close card", exact: true })
      .click();
    await page.getByRole("button", { name: `Open actions for ${frontText}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
  });
  await test.step("Then: the editor also keeps the current Deck's tag and excludes the foreign Deck's tag", async () => {
    await expect(page.getByRole("checkbox", { name: "chapter-1", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "python", exact: true })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-CARD-CREATE-07 keeps long creation feedback readable and returns dismiss focus to main", async ({
  page,
}) => {
  const prefix = "Created card “CARD-MANAGEMENT-06 local front.";
  const frontText =
    `CARD-MANAGEMENT-06 local front. ${"This paragraph explains a useful idea with enough detail to study later. ".repeat(26)}`.slice(
      0,
      1748
    );
  const backText = "CARD-MANAGEMENT-06 local back";
  const messageText = `Created card “${frontText}”.`;
  await test.step("Given: an anonymous creation form at 360 by 640 with notification time controlled", async () => {
    const time = Date.UTC(2026, 6, 1, 12);
    await page.clock.install({ time });
    await page.clock.pauseAt(time);
    await page.setViewportSize({ width: 360, height: 640 });
    await open(page, domain, "create");
    await expect(page).toHaveURL(/\/deck\/form-deck\/card\/new$/);
  });
  await test.step("When: enter a 1748-character front and a valid back and create the Card", async () => {
    await fill(page, frontText, backText);
    await page.getByRole("button", { name: "Create card", exact: true }).click();
  });
  const dismiss = page.getByRole("button", { name: "Dismiss notification", exact: true });
  await test.step("Then: the toast, message, and dismiss control fit the viewport with at most three visible lines", async () => {
    await expect(page).toHaveURL(/\/deck\/form-deck$/);
    await expect(page.getByRole("status").filter({ hasText: messageText })).toBeVisible();
    const toast = dismiss.locator("..");
    const message = toast.getByText(messageText, { exact: true });
    await expect(dismiss).toHaveAccessibleDescription(messageText);
    for (const target of [toast, message, dismiss]) {
      const bounds = await target.boundingBox();
      if (bounds === null) throw new Error("Toast content has no rendered bounds");
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(360);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(640);
    }
    const preview = await message.evaluate((element, prefixText) => {
      const text = element.firstChild;
      if (text === null) throw new Error("Toast message is empty");
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, prefixText.length);
      const prefixBounds = range.getBoundingClientRect();
      const bounds = element.getBoundingClientRect();
      return {
        height: bounds.height,
        lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
        prefixTop: prefixBounds.top,
        prefixBottom: prefixBounds.bottom,
        top: bounds.top,
        bottom: bounds.bottom,
      };
    }, prefix);
    expect(preview.height).toBeLessThanOrEqual(preview.lineHeight * 3);
    expect(preview.prefixTop).toBeGreaterThanOrEqual(preview.top);
    expect(preview.prefixBottom).toBeLessThanOrEqual(preview.bottom);
  });
  await test.step("When: reach Dismiss with the pointer and keyboard", async () => {
    await dismiss.click({ trial: true });
    await dismiss.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
  });
  await test.step("Then: show a visible keyboard focus indicator", async () => {
    await expect(dismiss).toBeFocused();
    expect(await dismiss.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
    await expect(dismiss).not.toHaveCSS("box-shadow", "none");
  });
  await test.step("When: dismiss with Enter", () => page.keyboard.press("Enter"));
  await test.step("Then: remove the notification and focus the persistent main content", async () => {
    await expect(dismiss).toHaveCount(0);
    await expect(page.getByRole("main")).toBeFocused();
  });
  await test.step("When: inspect the created Card", async () => {
    await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toHaveCount(1);
    await page.getByRole("button", { name: `View ${frontText}`, exact: true }).click();
  });
  await test.step("Then: preserve full Card content independently of the toast preview", async () => {
    await expect(page.getByRole("dialog", { name: frontText, exact: true })).toContainText(backText);
    expect(await requests(page)).toMatchObject([{ kind: "create", input: { frontText, backText, tags: [] } }]);
  });
});
