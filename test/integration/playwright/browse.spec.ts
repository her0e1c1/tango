import type { Locator, Page } from "@playwright/test";
import { expect, test, open, callScenario } from "./fixtures";

const cardNames = ["Hello", "Second", "Third", "Fourth", "Fifth"];
const start = (page: Page, variant = "list", params: Record<string, string> = {}) =>
  open(page, "browse", variant, params);
const call = (page: Page, name: string, value?: unknown) => callScenario(page, "browse", name, value);
const observations = (page: Page) => call(page, "getObservations");
const filters = (page: Page) => page.getByText("Filters", { exact: true });
const scrollable = async (target: Locator) =>
  expect(await target.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
async function drag(target: Locator, dx: number, dy = 0, button = 0) {
  await target.evaluate(
    (element, input) => {
      const { dx, dy, button } = input;
      element.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          button,
          buttons: button === 0 ? 1 : button === 1 ? 4 : 2,
          clientX: 200,
          clientY: 200,
        })
      );
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          button,
          buttons: button === 0 ? 1 : button === 1 ? 4 : 2,
          clientX: 200 + dx,
          clientY: 200 + dy,
        })
      );
      document.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: true, button, clientX: 200 + dx, clientY: 200 + dy })
      );
      element.dispatchEvent(new MouseEvent(button === 0 ? "click" : "auxclick", { bubbles: true, button }));
    },
    { dx, dy, button }
  );
}

test("PLAYWRIGHT-CARD-LIST-01 opens creation for the same Deck", async ({ page }) => {
  await test.step("Given: the real Card List contains cards", () => start(page));
  await test.step("When: Add card is chosen from Actions", async () => {
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add card" }).click();
  });
  await test.step("Then: the same Deck's create form opens", async () => {
    await expect(page.getByRole("heading", { name: "Create card" })).toBeVisible();
    await expect(page.getByText("Add a card to Japanese verbs.")).toBeVisible();
  });
});

test("PLAYWRIGHT-CARD-LIST-02 PLAYWRIGHT-CARD-LIST-17 explains no cards and opens creation", async ({ page }) => {
  await test.step("Given: the Deck has no cards", () => start(page, "none"));
  await test.step("When: its empty list is rendered", async () => {});
  await test.step("Then: no cards and the available creation action are visible", async () => {
    await expect(page.getByText("0 cards", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No cards yet" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add card", exact: true })).toBeEnabled();
  });
  await test.step("When: creation is requested from the empty state", () =>
    page.getByRole("button", { name: "Add card", exact: true }).click());
  await test.step("Then: creation is for the same Deck", async () => {
    await expect(page.getByRole("heading", { name: "Create card" })).toBeVisible();
    await expect(page.getByText("Add a card to Japanese verbs.")).toBeVisible();
  });
});

test("PLAYWRIGHT-CARD-LIST-03 PLAYWRIGHT-CARD-LIST-18 distinguishes and clears zero matches", async ({ page }) => {
  await test.step("Given: an unavailable selected tag matches no cards", () => start(page, "unmatched"));
  await test.step("When: the filtered list renders", async () => {});
  await test.step("Then: filtering has its own empty explanation", async () => {
    await expect(page.getByRole("heading", { name: "No cards match the active filters" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No cards yet" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });
  await test.step("When: the filter is cleared", () => page.getByRole("button", { name: "Clear filters" }).click());
  await test.step("Then: all five Deck cards return without selected tags", async () => {
    await expect(page.getByRole("button", { name: "View Hello", exact: true })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(5);
    await expect(page.getByRole("list", { name: "Selected tags" })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-CARD-LIST-04 retains future review cards for browsing", async ({ page }) => {
  await test.step("Given: all five cards are due tomorrow and review intervals are enabled", () =>
    start(page, "future"));
  await test.step("When: the real Card List renders", async () => {});
  await test.step("Then: all five cards remain available", async () => {
    await expect(page.getByRole("button", { name: "View Hello", exact: true })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(5);
    await expect(page.getByRole("heading", { name: "No cards due for review" })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-CARD-LIST-05 PLAYWRIGHT-CARD-LIST-07 opens with keyboard and restores the exact opener", async ({
  page,
}) => {
  const opener = page.getByRole("button", { name: "View Second", exact: true });
  const preview = page.getByRole("dialog", { name: "Second", exact: true });
  await test.step("Given: two different answers are available", async () => {
    await start(page);
    await opener.focus();
  });
  await test.step("When: the chosen answer is opened with Enter", () => opener.press("Enter"));
  await test.step("Then: its title owns focus and its answer is isolated", async () => {
    const title = preview.getByRole("heading", { name: "Second", exact: true });
    await expect(title).toBeFocused();
    await expect(preview).toContainText("Second answer");
    await expect(preview.getByText("Hola", { exact: true })).toHaveCount(0);
  });
  await test.step("When: focus is requested on the inert background", async () => {
    await page
      .getByRole("combobox", { name: "Sort order", includeHidden: true })
      .evaluate((element) => (element as HTMLElement).focus());
  });
  await test.step("Then: focus remains on the preview title", () =>
    expect(preview.getByRole("heading", { name: "Second", exact: true })).toBeFocused());
  await test.step("When: page shortcuts are pressed while the preview is open", async () => {
    await page.keyboard.press("s");
    await page.keyboard.press("t");
  });
  await test.step("Then: the Card List and preview remain active", async () => {
    await expect(preview).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cards", exact: true, includeHidden: true })).toBeAttached();
  });
  await test.step("When: the independent Close action is activated", () =>
    preview.getByRole("button", { name: "Close card" }).click());
  await test.step("Then: the exact opener regains focus", async () => {
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
  await test.step("When: another card is opened with Space", async () => {
    const next = page.getByRole("button", { name: "View Hello", exact: true });
    await next.focus();
    await next.press("Space");
  });
  await test.step("Then: that named answer opens", () =>
    expect(page.getByRole("dialog", { name: "Hello", exact: true })).toContainText("Hola"));
});

test("PLAYWRIGHT-CARD-LIST-23 preserves opening snapshot, renderer, scroll, focus and entity state", async ({
  page,
}) => {
  let before: unknown;
  let updated: unknown;
  const preview = page.getByRole("dialog", { name: "Hello", exact: true });
  const reader = preview.getByRole("region", { name: "Answer", exact: true });
  await test.step("Given: a long answer and a running session exist", async () => {
    await start(page, "snapshot");
    before = await call(page, "getPreviewState");
  });
  await test.step("When: the answer is opened and scrolled", async () => {
    await page.getByRole("button", { name: "View Hello", exact: true }).click();
    await reader.focus();
    await reader.evaluate((element) => {
      element.scrollTop = 200;
    });
  });
  await test.step("Then: reading is at 200 without changing entity data", async () => {
    await expect.poll(() => reader.evaluate((element) => element.scrollTop)).toBe(200);
    expect(await call(page, "getPreviewState")).toBe(before);
  });
  await test.step("When: incoming store data changes that card's content and renderer tag", () =>
    call(page, "updateCards", "snapshot"));
  await test.step("Then: the row updates while the open answer and focus remain", async () => {
    await expect(page.getByRole("button", { name: "View Updated Hello", includeHidden: true })).toBeAttached();
    await expect(preview).toContainText("Original answer");
    await expect(preview.getByRole("code")).toHaveCount(0);
    await expect.poll(() => reader.evaluate((element) => element.scrollTop)).toBe(200);
    await expect(reader).toBeFocused();
    updated = await call(page, "getPreviewState");
  });
  await test.step("When: the card is closed and reopened", async () => {
    await preview.getByRole("button", { name: "Close card" }).click();
    const opener = page.getByRole("button", { name: "View Updated Hello" });
    await expect(opener).toBeFocused();
    await opener.click();
  });
  await test.step("Then: reopening uses updated code without changing entity data", async () => {
    await expect(page.getByRole("dialog", { name: "Updated Hello" }).getByRole("code")).toContainText(
      "const updated = true;"
    );
    expect(await call(page, "getPreviewState")).toBe(updated);
  });
});

test("PLAYWRIGHT-CARD-LIST-24 restores Sort when the opener disappears", async ({ page }) => {
  await test.step("Given: a connected card opens its answer", async () => {
    await start(page);
    await page.getByRole("button", { name: "View Hello", exact: true }).click();
  });
  await test.step("When: incoming data removes every card", () => call(page, "updateCards", "empty"));
  await test.step("Then: its answer remains readable without the original row", async () => {
    await expect(page.getByRole("button", { name: "View Hello", includeHidden: true })).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Hello", exact: true })).toContainText("Hola");
  });
  await test.step("When: the retained answer is closed", () =>
    page.getByRole("button", { name: "Close card" }).click());
  await test.step("Then: Sort receives focus in the empty list", async () => {
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: "Sort order" })).toBeFocused();
    await expect(page.getByRole("heading", { name: "No cards yet" })).toBeVisible();
  });
});

test("PLAYWRIGHT-CARD-LIST-25 keeps one notification inside and after the modal", async ({ page }) => {
  const opener = page.getByRole("button", { name: "View Hello", exact: true });
  const preview = page.getByRole("dialog", { name: "Hello", exact: true });
  await test.step("Given: the Page owns an open answer and one Toast viewport", async () => {
    await start(page);
    await opener.click();
  });
  await test.step("When: a persistent warning arrives", () => call(page, "notify"));
  await test.step("Then: one live region is inside the modal and focus stays on its title", async () => {
    await expect(preview.getByRole("status")).toBeVisible();
    await expect(preview.getByRole("status")).toContainText("Unable to save changes. Try again.");
    await expect(preview.getByText("Unable to save changes. Try again.", { exact: true })).toBeVisible();
    await expect(page.getByRole("status", { includeHidden: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Dismiss notification" })).toHaveCount(0);
    await expect(preview.getByRole("heading", { name: "Hello", exact: true })).toBeFocused();
  });
  await test.step("When: the user closes the answer", () =>
    preview.getByRole("button", { name: "Close card" }).click());
  await test.step("Then: the same visible warning returns to the Page with its dismissal action", async () => {
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Unable to save changes. Try again.");
    await expect(page.getByText("Unable to save changes. Try again.", { exact: true })).toBeVisible();
    await expect(page.getByRole("status", { includeHidden: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Dismiss notification" })).toBeVisible();
    await expect(opener).toBeFocused();
  });
});

test("PLAYWRIGHT-CARD-LIST-06 PLAYWRIGHT-CARD-LIST-12 PLAYWRIGHT-CARD-LIST-13 removes selected chips with stable focus", async ({
  page,
}) => {
  await test.step("Given: A and B both filter the list", async () => {
    await start(page, "selected");
    await page.getByRole("button", { name: "Remove A filter" }).focus();
  });
  await test.step("When: A is removed with Enter", () => page.keyboard.press("Enter"));
  await test.step("Then: B retains focus and four matching rows remain", async () => {
    await expect(page.getByRole("button", { name: "Remove A filter" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Remove B filter" })).toBeFocused();
    await expect(page.getByRole("article")).toHaveCount(4);
    await expect(page.getByRole("button", { name: "View Hello", exact: true })).toHaveCount(0);
  });
  await test.step("When: the final chip is removed", () => page.keyboard.press("Enter"));
  await test.step("Then: Filters owns focus and five rows return", async () => {
    await expect(page.getByRole("list", { name: "Selected tags" })).toHaveCount(0);
    await expect(filters(page).locator("..")).toBeFocused();
    await expect(page.getByRole("article")).toHaveCount(5);
  });
});

test("PLAYWRIGHT-CARD-LIST-08 PLAYWRIGHT-CARD-LIST-09 PLAYWRIGHT-CARD-LIST-19 sorts and edits the identified row", async ({
  page,
}) => {
  const select = page.getByRole("combobox", { name: "Sort order" });
  await test.step("Given: five ordered cards are in the list", () => start(page));
  await test.step("When: newest is selected", () => select.selectOption("newest"));
  await test.step("Then: Fifth is first", () => expect(page.getByRole("article").first()).toContainText("Fifth"));
  await test.step("When: Standard is restored", () => select.selectOption("standard"));
  await test.step("Then: the original order and selection return", async () => {
    await expect(select).toHaveValue("standard");
    expect(
      await page
        .getByRole("button", { name: /^View / })
        .evaluateAll((elements) => elements.map((element) => element.getAttribute("aria-label")))
    ).toEqual(cardNames.map((name) => `View ${name}`));
  });
  await test.step("When: Second's Edit action is chosen", async () => {
    await page.getByRole("button", { name: "Open actions for Second", exact: true }).click();
    await expect(page.getByRole("menuitem")).toHaveText(["Edit", "Delete"]);
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  });
  await test.step("Then: that editor has Second's front and no menu", async () => {
    await expect(page.getByRole("heading", { name: "Edit card" })).toBeVisible();
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Second");
  });
  await test.step("When: the editor's Back tab is selected", () =>
    page.getByRole("tab", { name: "Back", exact: true }).click());
  await test.step("Then: Second's answer is available", () =>
    expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("Second answer"));
});

test("PLAYWRIGHT-CARD-LIST-15 closes a removed menu and never reopens it on reinsertion", async ({ page }) => {
  await test.step("Given: the list contains Hello and Second", () => start(page));
  await test.step("When: menus are opened in turn", async () => {
    await page.getByRole("button", { name: "Open actions for Hello", exact: true }).click();
    await page.getByRole("button", { name: "Open actions for Second", exact: true }).focus();
    await page.keyboard.press("Enter");
  });
  await test.step("Then: only Second's menu remains", async () => {
    await expect(page.getByRole("menu")).toHaveCount(1);
    await expect(page.getByRole("menu", { name: "Actions for Second", exact: true })).toBeVisible();
  });
  await test.step("When: Second disappears", () => call(page, "updateCards", "remove-second"));
  await test.step("Then: the menu and row disappear", async () => {
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "View Second", exact: true })).toHaveCount(0);
  });
  await test.step("When: Second is reinserted", () => call(page, "updateCards", "restore"));
  await test.step("Then: its row returns with no open menu", async () => {
    await expect(page.getByRole("button", { name: "View Second", exact: true })).toBeVisible();
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
});

test("PLAYWRIGHT-CARD-LIST-16 keeps menu identity through incoming order changes", async ({ page }) => {
  await test.step("Given: newest order is selected and Hello's menu is open", async () => {
    await start(page);
    await page.getByRole("combobox", { name: "Sort order" }).selectOption("newest");
    await page.getByRole("button", { name: "Open actions for Hello", exact: true }).click();
  });
  await test.step("When: Hello's creation time changes", () => call(page, "updateCards", "reorder"));
  await test.step("Then: Hello moves to the first row", () =>
    expect(page.getByRole("article").first()).toContainText("Hello"));
  await test.step("When: Edit is activated from the preserved menu", () =>
    page.getByRole("menuitem", { name: "Edit", exact: true }).click());
  await test.step("Then: Hello's editor opens", () =>
    expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Hello"));
});

test("PLAYWRIGHT-CARD-LIST-20 PLAYWRIGHT-CARD-LIST-21 PLAYWRIGHT-CARD-LIST-22 disables operations until deletion finishes", async ({
  page,
}) => {
  const first = page.getByRole("button", { name: "View Hello", exact: true, includeHidden: true });
  const second = page.getByRole("button", { name: "View Second", exact: true, includeHidden: true });
  const trigger = page.getByRole("button", { name: "Open actions for Hello", exact: true, includeHidden: true });
  await test.step("Given: both cards are available", () => start(page, "deletion"));
  await test.step("When: Hello's delete action is requested", async () => {
    await trigger.click();
    await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  });
  await test.step("Then: confirmation identifies Hello while both rows remain", async () => {
    await expect(page.getByRole("alertdialog")).toContainText("Hello");
    await expect(first).toBeAttached();
    await expect(second).toBeAttached();
  });
  await test.step("When: deletion is submitted and held pending", () =>
    page.getByRole("alertdialog").getByRole("button", { name: "Delete card", exact: true }).click());
  await test.step("Then: both previews and the menu trigger are disabled without removing rows", async () => {
    await expect(first).toBeDisabled();
    await expect(second).toBeDisabled();
    await expect(trigger).toBeDisabled();
  });
  await test.step("When: activation is attempted on the disabled trigger", () =>
    trigger.evaluate((element) => (element as HTMLButtonElement).click()));
  await test.step("Then: no menu opens and both rows remain", async () => {
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(first).toBeAttached();
    await expect(second).toBeAttached();
  });
  await test.step("When: the external deletion succeeds", () => call(page, "finishDelete"));
  await test.step("Then: confirmation and Hello disappear while Second is enabled", async () => {
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(first).toHaveCount(0);
    await expect(second).toBeEnabled();
  });
});

test("PLAYWRIGHT-DECK-FILTER-01 PLAYWRIGHT-DECK-FILTER-03 PLAYWRIGHT-DECK-FILTER-04 PLAYWRIGHT-DECK-FILTER-05 PLAYWRIGHT-DECK-FILTER-10 PLAYWRIGHT-DECK-FILTER-11 PLAYWRIGHT-CARD-LIST-14 filters real rows, switches Any/All and clears", async ({
  page,
}) => {
  await test.step("Given: three cards have A, B and A+B tags", async () => {
    await start(page, "tags");
    await filters(page).click();
    await expect(page.getByRole("checkbox", { name: "A", exact: true })).toHaveCount(1);
  });
  await test.step("When: A is selected", () =>
    page.getByRole("checkbox", { name: "A", exact: true }).locator("..").click());
  await test.step("Then: exactly two rows and one selected chip remain", async () => {
    await expect(page.getByRole("checkbox", { name: "A", exact: true })).toBeChecked();
    await expect(page.getByRole("button", { name: "Remove A filter" })).toHaveCount(1);
    await expect(page.getByRole("article")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "View Second", exact: true })).toHaveCount(0);
  });
  await test.step("When: keyboard focus moves from Any", async () => {
    await page.getByRole("radio", { name: "Any", exact: true }).focus();
    await page.keyboard.press("Tab");
  });
  await test.step("Then: selection and results do not change", async () => {
    await expect(page.getByRole("checkbox", { name: "A", exact: true })).toBeChecked();
    await expect(page.getByRole("article")).toHaveCount(2);
  });
  await test.step("When: B is also selected", () =>
    page.getByRole("checkbox", { name: "B", exact: true }).locator("..").click());
  await test.step("Then: Any includes all three rows", () => expect(page.getByRole("article")).toHaveCount(3));
  await test.step("When: All is selected", () =>
    page.getByRole("radio", { name: "All", exact: true }).locator("..").click());
  await test.step("Then: only Third matches", async () => {
    await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "View Third", exact: true })).toBeVisible();
  });
  await test.step("When: Clear is activated with Enter", async () => {
    await page.getByRole("button", { name: "Clear", exact: true }).focus();
    await page.keyboard.press("Enter");
  });
  await test.step("Then: Clear is disabled, Any gets focus and all rows return with no disclosure", async () => {
    await expect(page.getByRole("button", { name: "Clear", exact: true })).toBeDisabled();
    await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeFocused();
    await expect(page.getByRole("list", { name: "Selected tags" })).toHaveCount(0);
    await expect(page.getByRole("article")).toHaveCount(3);
    await expect(page.getByRole("checkbox")).toHaveCount(2);
    await expect(page.getByRole("button", { name: /Show .* more tags/ })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-DECK-FILTER-02 PLAYWRIGHT-DECK-FILTER-07 PLAYWRIGHT-DECK-FILTER-15 reveals extra tags with keyboard and preserves state on translation", async ({
  page,
}) => {
  await test.step("Given: twelve candidate tags are collapsed", async () => {
    await start(page, "more");
    await filters(page).click();
    await expect(page.getByRole("checkbox", { name: "tag-09", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Show 4 more tags" }).focus();
  });
  await test.step("When: the disclosure is activated with Enter", () => page.keyboard.press("Enter"));
  await test.step("Then: the first additional tag receives focus", () =>
    expect(page.getByRole("checkbox", { name: "tag-09", exact: true })).toBeFocused());
  await test.step("When: Space selects that tag", () => page.keyboard.press("Space"));
  await test.step("Then: only Tagged 9 remains", async () => {
    await expect(page.getByRole("checkbox", { name: "tag-09", exact: true })).toBeChecked();
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "View Tagged 9", exact: true })).toBeVisible();
  });
  await test.step("When: application language changes", () => call(page, "changeLanguage", "ja"));
  await test.step("Then: all tags remain expanded and the selection survives", async () => {
    await expect(page.getByRole("button", { name: "表示するタグを減らす" })).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("checkbox", { name: "tag-12", exact: true })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "tag-09", exact: true })).toBeChecked();
  });
});

test("PLAYWRIGHT-DECK-FILTER-08 moves focus before a deselected choice collapses", async ({ page }) => {
  await test.step("Given: the twelfth tag is selected outside the collapsed eight", async () => {
    await start(page, "disappear");
    await filters(page).click();
    await page.getByRole("checkbox", { name: "tag-12", exact: true }).focus();
  });
  await test.step("When: Space deselects it", () => page.keyboard.press("Space"));
  await test.step("Then: it disappears, the first choice gets focus and all rows return", async () => {
    await expect(page.getByRole("checkbox", { name: "tag-12", exact: true })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: "tag-01", exact: true })).toBeFocused();
    await expect(page.getByRole("article")).toHaveCount(12);
  });
});

test("PLAYWRIGHT-DECK-FILTER-06 PLAYWRIGHT-DECK-FILTER-09 keeps and removes unavailable selected tags", async ({
  page,
}) => {
  await test.step("Given: missing and A are selected", async () => {
    await start(page, "stale-list");
    await filters(page).click();
    await expect(page.getByRole("checkbox").first()).toHaveAccessibleName("missing");
    await expect(page.getByRole("checkbox", { name: "missing", exact: true })).toBeChecked();
  });
  await test.step("When: A and then missing are removed individually", async () => {
    await page.getByRole("checkbox", { name: "A", exact: true }).locator("..").click();
    await page.getByRole("checkbox", { name: "missing", exact: true }).focus();
    await page.keyboard.press("Space");
  });
  await test.step("Then: missing disappears, A gets focus and all five rows return", async () => {
    await expect(page.getByRole("checkbox", { name: "missing", exact: true })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: "A", exact: true })).toBeFocused();
    await expect(page.getByRole("article")).toHaveCount(5);
  });
});

test("PLAYWRIGHT-DECK-FILTER-12 retains All without candidate tags", async ({ page }) => {
  await test.step("Given: all cards are untagged and All is selected", () => start(page, "no-tags"));
  await test.step("When: Filters is opened", () => filters(page).click());
  await test.step("Then: no-tags copy appears and All and all five rows remain", async () => {
    await expect(page.getByText("No tags available.")).toBeVisible();
    await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
    await expect(page.getByRole("article")).toHaveCount(5);
  });
});

test("PLAYWRIGHT-CARD-LIST-11 PLAYWRIGHT-DECK-FILTER-14 preserves full long tag labels on a narrow viewport", async ({
  page,
}) => {
  const tag = "averylongunbrokentag".repeat(12);
  await test.step("Given: a long selected tag on a narrow viewport", async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await start(page, "long-list");
    await expect(page.getByRole("button", { name: `Remove ${tag} filter` })).toBeVisible();
  });
  await test.step("When: Filters opens", () => filters(page).click());
  await test.step("Then: the candidate and selected chip retain the full name", async () => {
    await expect(page.getByRole("checkbox", { name: tag, exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: tag, exact: true })).toHaveAccessibleName(tag);
    await expect(page.getByRole("button", { name: `Remove ${tag} filter` })).toContainText(tag);
  });
});

test("PLAYWRIGHT-DECK-FILTER-13 keeps eighty selected tags in bounded scrolling regions", async ({ page }) => {
  const selected = page.getByRole("list", { name: "Selected tags" });
  await test.step("Given: eighty tags are selected on a narrow viewport", async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await start(page, "many-list");
    await expect(selected.getByRole("button")).toHaveCount(80);
    await scrollable(selected);
  });
  await test.step("When: the selected tags are scrolled to the end", () =>
    selected.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event("scroll"));
    }));
  await test.step("Then: the final selected chip is available", async () => {
    await expect.poll(() => selected.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(selected.getByRole("button", { name: "Remove Selected tag 80 filter" })).toBeVisible();
  });
  await test.step("When: candidate choices open", () => filters(page).click());
  await test.step("Then: all eighty selected choices are in a bounded scrolling region", async () => {
    const choices = page.getByRole("group", { name: "Tag choices" });
    await expect(choices.getByRole("checkbox", { checked: true })).toHaveCount(80);
    await scrollable(choices);
  });
});

test("PLAYWRIGHT-CARD-LIST-10 renders unknown empty state without inventing a reason", async ({ page }) => {
  await test.step("Given: Card List has no confirmed empty reason", () => start(page, "list-component:unknown"));
  await test.step("When: its public presentation renders", async () => {});
  await test.step("Then: structural controls remain without claiming no cards or showing a second shell", async () => {
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
    for (const text of ["0 cards", "Filters", "No filters"])
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    await expect(page.getByText("No cards yet", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "tango", exact: true })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-CARD-LIST-52 distinguishes the presentation's no-due reason", async ({ page }) => {
  await test.step("Given: the presentation is explicitly supplied interval-zero", () =>
    start(page, "list-component:interval"));
  await test.step("When: the empty presentation renders", async () => {});
  await test.step("Then: no-due copy appears without a Clear filters action", async () => {
    await expect(page.getByRole("heading", { name: "No cards due for review" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear filters" })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-CARD-LIST-12 PLAYWRIGHT-CARD-LIST-13 PLAYWRIGHT-CARD-LIST-14 preserves chip callback and complete keyboard order", async ({
  page,
}) => {
  await test.step("Given: the presentation has one and two selected", async () => {
    await start(page, "list-component:keyboard");
    await page.getByRole("button", { name: "Remove one filter" }).focus();
  });
  await test.step("When: Tab and Shift+Tab traverse the chips", async () => {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Remove two filter" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
  });
  await test.step("Then: one regains focus and no removal was requested", async () => {
    await expect(page.getByRole("button", { name: "Remove one filter" })).toBeFocused();
    expect(await observations(page)).toEqual([]);
  });
  await test.step("When: Enter removes one", () => page.keyboard.press("Enter"));
  await test.step("Then: callback identifies one and two receives focus", async () => {
    expect(await observations(page)).toEqual([{ name: "remove", value: "one" }]);
    await expect(page.getByRole("button", { name: "Remove two filter" })).toBeFocused();
  });
  await test.step("When: Tab leaves the last chip", () => page.keyboard.press("Tab"));
  await test.step("Then: the first Card preview is next", () =>
    expect(page.getByRole("button", { name: "View Hello", exact: true })).toBeFocused());
  await test.step("When: Space removes the last chip", async () => {
    await page.getByRole("button", { name: "Remove two filter" }).focus();
    await page.keyboard.press("Space");
  });
  await test.step("Then: two is reported and the filter summary owns focus", async () => {
    expect(await observations(page)).toEqual([
      { name: "remove", value: "one" },
      { name: "remove", value: "two" },
    ]);
    await expect(page.getByRole("button", { name: /Remove .* filter/ })).toHaveCount(0);
    await expect(page.getByText("No filters", { exact: true }).locator("xpath=ancestor::summary")).toBeFocused();
  });
});

for (const edit of [false, true]) {
  test(`PLAYWRIGHT-CARD-LIST-16 preserves ${edit ? "Edit" : "View"} focus and callback through reverse/remove/reinsert`, async ({
    page,
  }) => {
    let target: Locator;
    await test.step("Given: a row operation owns focus", async () => {
      await start(page, "list-component:rows");
      if (edit) await page.getByRole("button", { name: "Open actions for Hello", exact: true }).click();
      target = edit
        ? page.getByRole("menuitem", { name: "Edit", exact: true })
        : page.getByRole("button", { name: "View Hello", exact: true });
      await target.focus();
    });
    for (const label of ["Reverse rows", "Toggle Second", "Toggle Second"]) {
      await test.step(`When: ${label} updates other rows without moving focus`, () =>
        page.getByRole("button", { name: label, exact: true }).evaluate((element) => (element as HTMLElement).click()));
      await test.step("Then: the surviving target still owns focus", async () => expect(target!).toBeFocused());
    }
    await test.step("When: Enter activates the preserved target", () => page.keyboard.press("Enter"));
    await test.step("Then: the callback identifies the same Card", async () =>
      expect(await observations(page)).toEqual([{ name: edit ? "edit" : "view", value: "browse-card-0" }]));
  });
}

test("PLAYWRIGHT-CARD-LIST-09 PLAYWRIGHT-CARD-LIST-21 preserves public menu callbacks and item ordering", async ({
  page,
}) => {
  await test.step("Given: the real menu presentation has a Binary search target", () => start(page, "menu-component"));
  await test.step("When: its action menu opens", () =>
    page.getByRole("button", { name: "Open actions for Binary search" }).click());
  await test.step("Then: the named group exposes Edit then Delete", async () => {
    await expect(page.getByRole("group", { name: "Card actions for Binary search" })).toBeVisible();
    await expect(page.getByRole("menu", { name: "Actions for Binary search" })).toBeVisible();
    await expect(page.getByRole("menuitem")).toHaveText(["Edit", "Delete"]);
  });
  await test.step("When: Edit is selected", () => page.getByRole("menuitem", { name: "Edit", exact: true }).click());
  await test.step("Then: Edit is reported once and the menu closes", async () => {
    expect(await observations(page)).toEqual([{ name: "edit" }]);
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
  await test.step("When: Delete is selected after reopening", async () => {
    await page.getByRole("button", { name: "Open actions for Binary search" }).click();
    await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  });
  await test.step("Then: Delete is reported once", async () =>
    expect(await observations(page)).toEqual([{ name: "edit" }, { name: "delete" }]));
});

test("PLAYWRIGHT-CARD-LIST-22 hides a disabled menu even when open is requested", async ({ page }) => {
  await test.step("Given: disabled and open are both supplied to the real menu", () =>
    start(page, "menu-component-disabled"));
  await test.step("When: its presentation renders", async () => {});
  await test.step("Then: the trigger is disabled and there is no menu", async () => {
    await expect(page.getByRole("button", { name: "Open actions for Binary search" })).toBeDisabled();
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
});

test("PLAYWRIGHT-DECK-FILTER-01 reports the cleared form value", async ({ page }) => {
  await test.step("Given: DeckFilterForm has tag 1 selected", () => start(page, "form-component"));
  await test.step("When: Clear is selected", () => page.getByRole("button", { name: "Clear", exact: true }).click());
  await test.step("Then: an empty selection is reported and tag 1 is unchecked", async () => {
    expect(await observations(page)).toEqual([{ name: "tags", value: [] }]);
    await expect(page.getByRole("checkbox", { name: "tag 1", exact: true })).not.toBeChecked();
  });
});

test("PLAYWRIGHT-DECK-FILTER-03 PLAYWRIGHT-DECK-FILTER-05 PLAYWRIGHT-DECK-FILTER-10 preserves component callbacks for selecting, Any/All and clearing", async ({
  page,
}) => {
  await test.step("Given: two options and Any are selected in the real TagFilter", () =>
    start(page, "filter-component:selection"));
  await test.step("When: one is selected", () =>
    page.getByRole("checkbox", { name: "one", exact: true }).locator("..").click());
  await test.step("Then: the public callback receives one without a combobox", async () => {
    expect(await observations(page)).toEqual([{ name: "tags", value: ["one"] }]);
    await expect(page.getByRole("combobox")).toHaveCount(0);
  });
  for (const [name, value] of [
    ["All", true],
    ["Any", false],
  ] as const) {
    await test.step(`When: ${name} is selected`, () =>
      page.getByRole("radio", { name, exact: true }).locator("..").click());
    await test.step("Then: the matching value is reported and selected", async () => {
      expect(((await observations(page)) as { name: string; value: unknown }[]).at(-1)).toEqual({
        name: "matchAll",
        value,
      });
      await expect(page.getByRole("radio", { name, exact: true })).toBeChecked();
    });
  }
  await test.step("When: Clear is selected", () => page.getByRole("button", { name: "Clear", exact: true }).click());
  await test.step("Then: it is disabled and Any owns focus", async () => {
    await expect(page.getByRole("button", { name: "Clear", exact: true })).toBeDisabled();
    await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeFocused();
  });
});

for (const [option, expected] of [
  ["two", ["one", "two"]],
  ["one", []],
] as const) {
  test(`PLAYWRIGHT-DECK-FILTER-04 deduplicates existing selections when toggling ${option}`, async ({ page }) => {
    await test.step("Given: selected values contain one twice", async () => {
      await start(page, "filter-component:duplicates");
      await expect(page.getByText("1 selected", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Clear", exact: true })).toBeEnabled();
    });
    await test.step(`When: ${option} is toggled`, () =>
      page.getByRole("checkbox", { name: option, exact: true }).locator("..").click());
    await test.step("Then: the callback contains each selected value once", async () =>
      expect(await observations(page)).toEqual([{ name: "tags", value: expected }]));
  });
}

test("PLAYWRIGHT-DECK-FILTER-02 PLAYWRIGHT-DECK-FILTER-07 traverses every disclosed tag and restores disclosure focus", async ({
  page,
}) => {
  await test.step("Given: twelve component options are collapsed", async () => {
    await start(page, "filter-component:keyboard");
    await page.getByRole("button", { name: "Show 4 more tags" }).focus();
  });
  await test.step("When: Enter reveals them", () => page.keyboard.press("Enter"));
  await test.step("Then: all twelve options are visible and expanded", async () => {
    await expect(page.getByRole("checkbox")).toHaveCount(12);
    await expect(page.getByRole("button", { name: "Show fewer tags" })).toHaveAttribute("aria-expanded", "true");
  });
  for (const tag of ["tag-9", "tag-10", "tag-11", "tag-12"]) {
    await test.step(`Then: ${tag} is the next keyboard target`, () =>
      expect(page.getByRole("checkbox", { name: tag, exact: true })).toBeFocused());
    await test.step("When: Tab continues", () => page.keyboard.press("Tab"));
  }
  await test.step("Then: Show fewer receives focus", () =>
    expect(page.getByRole("button", { name: "Show fewer tags" })).toBeFocused());
  await test.step("When: Space collapses them", () => page.keyboard.press("Space"));
  await test.step("Then: eight remain and disclosure retains focus", async () => {
    await expect(page.getByRole("checkbox")).toHaveCount(8);
    await expect(page.getByRole("button", { name: "Show 4 more tags" })).toBeFocused();
  });
});

for (const [variant, removed, focus] of [
  ["hidden", "tag-12", "tag-1"],
  ["stale", "stale", "Any"],
] as const) {
  test(`PLAYWRIGHT-DECK-FILTER-${variant === "hidden" ? "08" : "09"} restores focus when ${variant} option disappears`, async ({
    page,
  }) => {
    await test.step("Given: the selected component choice will disappear when deselected", async () => {
      await start(page, `filter-component:${variant}`);
      await page.getByRole("checkbox", { name: removed, exact: true }).focus();
    });
    await test.step("When: Space removes it", () => page.keyboard.press("Space"));
    await test.step("Then: an available control owns focus", async () => {
      await expect(page.getByRole("checkbox", { name: removed, exact: true })).toHaveCount(0);
      await expect(
        page.getByRole(variant === "hidden" ? "checkbox" : "radio", { name: focus, exact: true })
      ).toBeFocused();
      if (variant === "stale") await expect(page.getByRole("checkbox")).toHaveCount(0);
    });
  });
}

test("PLAYWRIGHT-DECK-FILTER-06 keeps unavailable selected choices first and deduplicates the exact candidate order", async ({
  page,
}) => {
  await test.step("Given: duplicate options and duplicate stale selections", () =>
    start(page, "filter-component:unavailable"));
  await test.step("When: collapsed choices render", async () => {});
  await test.step("Then: selected values precede eight unselected values without duplicates", async () =>
    expect(
      await page
        .getByRole("checkbox")
        .evaluateAll((elements) => elements.map((element) => (element as HTMLInputElement).value))
    ).toEqual(["stale", "four", "one", "two", "three", "five", "six", "seven", "eight", "nine"]));
  await test.step("When: twelve is revealed, selected and the list collapsed", async () => {
    await page.getByRole("button", { name: "Show 3 more tags" }).click();
    await page.getByRole("checkbox", { name: "twelve", exact: true }).locator("..").click();
    await page.getByRole("button", { name: "Show fewer tags" }).click();
  });
  await test.step("Then: stale, four and twelve stay first and only two choices remain hidden", async () => {
    expect(
      await page
        .getByRole("checkbox")
        .evaluateAll((elements) => elements.slice(0, 3).map((element) => (element as HTMLInputElement).value))
    ).toEqual(["stale", "four", "twelve"]);
    await expect(page.getByRole("checkbox", { name: "twelve", exact: true })).toBeChecked();
    await expect(page.getByRole("button", { name: "Show 2 more tags" })).toHaveAttribute("aria-expanded", "false");
  });
});

test("PLAYWRIGHT-DECK-FILTER-11 shows exactly eight component choices without disclosure", async ({ page }) => {
  await test.step("Given: eight unselected candidate tags", () => start(page, "filter-component:eight"));
  await test.step("When: the choices render", async () => {});
  await test.step("Then: all eight, No filter and disabled Clear are present", async () => {
    await expect(page.getByRole("checkbox")).toHaveCount(8);
    await expect(page.getByText("No filter", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Show/ })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-DECK-FILTER-12 renders empty All without choices or disclosure", async ({ page }) => {
  await test.step("Given: no component candidates and All", () => start(page, "filter-component:empty-all"));
  await test.step("When: choices render", async () => {});
  await test.step("Then: All survives with no checkbox or disclosure", async () => {
    await expect(page.getByText("No tags available.")).toBeVisible();
    await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Show/ })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-DECK-FILTER-13 keeps all 120 selected component options in an auto scrolling region", async ({
  page,
}) => {
  await test.step("Given: 120 selected choices", () => start(page, "filter-component:many"));
  await test.step("When: the real TagFilter renders", async () => {});
  await test.step("Then: all selected values and count remain without disclosure in an auto-scroll region", async () => {
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(120);
    await expect(page.getByText("120 selected", { exact: true })).toBeVisible();
    const choices = page.getByRole("group", { name: "Tag choices" });
    expect(await choices.evaluate((element) => getComputedStyle(element).overflowY)).toBe("auto");
    await scrollable(choices);
    await expect(page.getByRole("button", { name: /Show/ })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-DECK-FILTER-14 preserves a full long component choice", async ({ page }) => {
  await test.step("Given: one unbroken long tag", () => start(page, "filter-component:long"));
  await test.step("When: its choice renders", async () => {});
  await test.step("Then: the accessible name contains the entire tag", () =>
    expect(page.getByRole("checkbox", { name: "averylongunbrokentag".repeat(12), exact: true })).toBeAttached());
});

test("PLAYWRIGHT-DECK-FILTER-15 retains all ten revealed component choices on language change", async ({ page }) => {
  await test.step("Given: ten choices are expanded", async () => {
    await start(page, "filter-component:language");
    await page.getByRole("button", { name: "Show 2 more tags" }).click();
  });
  await test.step("When: language changes to Japanese", () => call(page, "changeLanguage", "ja"));
  await test.step("Then: expansion and every option remain", async () => {
    await expect(page.getByRole("button", { name: "表示するタグを減らす" })).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("checkbox", { name: "tag-9", exact: true })).toBeAttached();
    await expect(page.getByRole("checkbox")).toHaveCount(10);
  });
});

test("PLAYWRIGHT-CARD-VIEW-01 PLAYWRIGHT-CARD-VIEW-02 reads both sides and edits the same card", async ({ page }) => {
  await test.step("Given: one requested card and other unrelated cards", () => start(page, "list", { page: "card" }));
  await test.step("When: the answer and then front are displayed", async () => {
    await expect(page.getByRole("region", { name: "Card answer" })).toContainText("Hola");
    await page.getByRole("button", { name: "Front", exact: true }).click();
  });
  await test.step("Then: only the requested card's front appears", async () => {
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Hello");
    await expect(page.getByText("Other prompt", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Second", { exact: true })).toHaveCount(0);
  });
  await test.step("When: Back then Front are selected", async () => {
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.getByRole("region", { name: "Card answer" })).toContainText("Hola");
    await page.getByRole("button", { name: "Front", exact: true }).click();
    await page.getByRole("link", { name: "Edit card" }).click();
  });
  await test.step("Then: the same card's edit form has its front", async () => {
    await expect(page.getByRole("heading", { name: "Edit card" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Hello");
  });
  await test.step("When: Back is selected in the editor", () =>
    page.getByRole("tab", { name: "Back", exact: true }).click());
  await test.step("Then: the same answer is available", () =>
    expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("Hola"));
});

test("PLAYWRIGHT-CARD-VIEW-03 PLAYWRIGHT-CARD-VIEW-10 explains a missing card and returns home", async ({ page }) => {
  await test.step("Given: the requested card is missing", () => start(page, "list", { page: "card", missing: "1" }));
  await test.step("When: the unavailable route renders", async () => {});
  await test.step("Then: the missing explanation excludes unrelated answers", async () => {
    await expect(page.getByRole("heading", { name: "Card not found" })).toBeVisible();
    await expect(page.getByText("Hola", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Other prompt", { exact: true })).toHaveCount(0);
  });
  await test.step("When: Go home is chosen", () => page.getByRole("button", { name: "Go home" }).click());
  await test.step("Then: the Deck list opens", () =>
    expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible());
});

test("PLAYWRIGHT-DECK-VIEW-01 browses only this Deck independently of due dates", async ({ page }) => {
  await test.step("Given: an unstudied card, a future review card and another Deck's card", () =>
    start(page, "order", { page: "deck" }));
  await test.step("When: Hello's front is opened", async () => {
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Hello");
    await page.getByRole("button", { name: "Card front", exact: true }).click();
  });
  await test.step("Then: Hello's answer appears", () =>
    expect(page.getByRole("region", { name: "Card answer" })).toContainText("Hola"));
  await test.step("When: the answer is flipped and Next is selected", async () => {
    await page.getByText("Hola", { exact: true }).click();
    await page.getByRole("button", { name: "Next card", exact: true }).click();
  });
  await test.step("Then: the future card is second of two and excludes the other Deck", async () => {
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Second");
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuetext", "2 of 2");
    await expect(page.getByText("Other prompt", { exact: true })).toHaveCount(0);
  });
  await test.step("When: Second is flipped", () =>
    page.getByRole("button", { name: "Card front", exact: true }).click());
  await test.step("Then: its own answer appears", () =>
    expect(page.getByRole("region", { name: "Card answer" })).toContainText("Second answer"));
});

test("PLAYWRIGHT-DECK-VIEW-02 explains an empty Deck and returns to Decks", async ({ page }) => {
  await test.step("Given: no cards in the viewed Deck", () => start(page, "deck-empty", { page: "deck" }));
  await test.step("When: Deck View renders", async () => {});
  await test.step("Then: empty copy appears without a card", async () => {
    await expect(page.getByRole("heading", { name: "No cards yet" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toHaveCount(0);
  });
  await test.step("When: Back to deck list is chosen", () =>
    page.getByRole("button", { name: "Back to deck list" }).click());
  await test.step("Then: the Deck list opens", () =>
    expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible());
});

test("PLAYWRIGHT-DECK-VIEW-03 distinguishes unmatched filters from no cards", async ({ page }) => {
  await test.step("Given: a Deck has cards but none match missing", () =>
    start(page, "deck-unmatched", { page: "deck" }));
  await test.step("When: Deck View renders", async () => {});
  await test.step("Then: the unmatched explanation and available return action appear", async () => {
    await expect(page.getByRole("heading", { name: "No cards match the current filters." })).toBeVisible();
    await expect(page.getByText("No cards yet", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Back to deck list" })).toBeEnabled();
  });
});

test("PLAYWRIGHT-CARD-PLAYER-01 PLAYWRIGHT-CARD-PLAYER-02 PLAYWRIGHT-CARD-PLAYER-09 reads, selects and edge-scrolls a long answer without moving cards", async ({
  page,
}) => {
  const answer = page.getByRole("region", { name: "Card answer" });
  await test.step("Given: a long raw answer is open in reading mode", async () => {
    await start(page, "reading", { page: "deck" });
    await page.getByRole("button", { name: "Card front", exact: true }).click();
    await call(page, "readingMode");
    await scrollable(answer);
  });
  await test.step("When: the answer is scrolled then dragged vertically", async () => {
    await answer.evaluate((element) => {
      element.scrollTop = 100;
      element.dispatchEvent(new Event("scroll"));
    });
    await expect.poll(() => answer.evaluate((element) => element.scrollTop)).toBe(100);
    await drag(answer, 0, 80);
  });
  await test.step("Then: the same answer remains", async () => {
    await expect(answer).toContainText("Paragraph 1:");
    await expect(page.getByText("Second answer", { exact: true })).toHaveCount(0);
  });
  await test.step("When: a text selection is dragged vertically", async () => {
    await answer.evaluate((element) => {
      const text = element.querySelector("pre")!.firstChild!;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 12);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(range);
    });
    await drag(answer, 0, 40);
  });
  await test.step("Then: the exact selection and answer remain without exiting", async () => {
    expect(await page.evaluate(() => window.getSelection()!.toString())).toBe("Paragraph 1:");
    await expect(answer).toBeVisible();
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toHaveCount(0);
  });
  let before = 0;
  await test.step("Given: text selection has been cleared", async () => {
    await page.evaluate(() => window.getSelection()!.removeAllRanges());
    before = await answer.evaluate((element) => element.scrollTop);
  });
  await test.step("When: an edge receives a wheel event", () =>
    page.getByRole("button", { name: "Swipe right", exact: true }).dispatchEvent("wheel", { deltaY: 100 }));
  await test.step("Then: that answer scrolls without advancing", async () => {
    await expect.poll(() => answer.evaluate((element) => element.scrollTop)).toBeGreaterThan(before);
    await expect(answer).toContainText("Paragraph 1:");
    await expect(page.getByText("Second answer", { exact: true })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-CARD-PLAYER-03 PLAYWRIGHT-CARD-PLAYER-14 separates Space playback, taps and swipe keyboard controls", async ({
  page,
}) => {
  await test.step("Given: Hello is on its front", async () => {
    await start(page, "list", { page: "deck" });
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Hello");
  });
  await test.step("When: Space starts playback", () => page.keyboard.press("Space"));
  await test.step("Then: playback is pressed while the front remains", async () => {
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Hello");
  });
  await test.step("When: the front is tapped", () =>
    page.getByRole("button", { name: "Card front", exact: true }).click());
  await test.step("Then: the answer appears", () =>
    expect(page.getByRole("region", { name: "Card answer" })).toContainText("Hola"));
  await test.step("When: the answer is tapped then b toggles swipe controls", async () => {
    await page.getByText("Hola", { exact: true }).click();
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Hello");
    await page.keyboard.press("b");
  });
  await test.step("Then: only swipe controls are hidden without moving or pausing", async () => {
    await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Hello");
    await expect(page.getByRole("slider")).toHaveValue("0");
  });
});

test("PLAYWRIGHT-CARD-PLAYER-04 PLAYWRIGHT-CARD-PLAYER-06 PLAYWRIGHT-CARD-PLAYER-07 PLAYWRIGHT-CARD-PLAYER-08 keeps answer chrome and edge navigation independent", async ({
  page,
}) => {
  await test.step("Given: Second is displayed with front editing and details", async () => {
    await start(page, "list", { page: "deck" });
    await page.getByRole("button", { name: "Next card", exact: true }).click();
    await expect(page.getByRole("link", { name: "Edit card" })).toBeVisible();
    await expect(page.getByText("not studied yet", { exact: true })).toBeVisible();
  });
  await test.step("When: Second's answer opens", () =>
    page.getByRole("button", { name: "Card front", exact: true }).click());
  await test.step("Then: answer hides front-only editing and details", async () => {
    await expect(page.getByRole("region", { name: "Card answer" })).toContainText("Second answer");
    await expect(page.getByRole("link", { name: "Edit card" })).toHaveCount(0);
    await expect(page.getByText("not studied yet", { exact: true })).toHaveCount(0);
  });
  await test.step("When: right edge is activated", () =>
    page.getByRole("button", { name: "Swipe right", exact: true }).click());
  await test.step("Then: Third's front appears", () =>
    expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Third"));
  await test.step("When: Third's answer then its left edge are activated", async () => {
    await page.getByRole("button", { name: "Card front", exact: true }).click();
    await page.getByRole("button", { name: "Swipe left", exact: true }).click();
  });
  await test.step("Then: Second's front returns", () =>
    expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Second"));
  await test.step("When: Second's answer content is tapped", async () => {
    await page.getByRole("button", { name: "Card front", exact: true }).click();
    await page.getByText("Second answer", { exact: true }).click();
  });
  await test.step("Then: Second flips without advancing", async () => {
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Second");
    await expect(page.getByRole("slider")).toHaveValue("1");
  });
  await test.step("When: swipe controls are hidden through viewing settings", async () => {
    await page.getByRole("button", { name: "Open card actions" }).click();
    await page.getByRole("button", { name: "Swipe controls", exact: true }).click();
    await page.getByRole("button", { name: "Close card actions" }).click();
    await page.getByRole("button", { name: "Card front", exact: true }).click();
    await page.getByRole("button", { name: "Swipe right", exact: true }).click();
  });
  await test.step("Then: the allowed answer edge still advances to Third", () =>
    expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Third"));
  await test.step("When: the next answer's left edge is activated", async () => {
    await page.getByRole("button", { name: "Card front", exact: true }).click();
    await page.getByRole("button", { name: "Swipe left", exact: true }).click();
  });
  await test.step("Then: it returns to Second", () =>
    expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Second"));
});

test("PLAYWRIGHT-CARD-PLAYER-05 PLAYWRIGHT-CARD-PLAYER-10 PLAYWRIGHT-CARD-PLAYER-11 PLAYWRIGHT-CARD-PLAYER-15 toggles individual viewing settings and restores help", async ({
  page,
}) => {
  const actions = () => page.getByRole("button", { name: "Open card actions" }).click();
  const close = () => page.getByRole("button", { name: "Close card actions" }).click();
  await test.step("Given: the Page is showing Hello", async () => {
    await start(page, "list", { page: "deck" });
    await actions();
  });
  await test.step("When: Edit link is hidden", async () => {
    await page.getByRole("button", { name: "Edit link", exact: true }).click();
    await close();
  });
  await test.step("Then: editing is hidden and content unchanged", async () => {
    await expect(page.getByRole("link", { name: "Edit card" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Hello");
  });
  await test.step("When: Edit link is restored", async () => {
    await actions();
    await page.getByRole("button", { name: "Edit link", exact: true }).click();
    await close();
  });
  await test.step("Then: Edit card is visible", () =>
    expect(page.getByRole("link", { name: "Edit card" })).toBeVisible());
  await test.step("When: Card details is hidden", async () => {
    await actions();
    await page.getByRole("button", { name: "Card details", exact: true }).click();
  });
  await test.step("Then: details are absent while playback remains selected", async () => {
    await expect(page.getByText("not studied yet", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Playback controls", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
  await test.step("When: Swipe controls is hidden", () =>
    page.getByRole("button", { name: "Swipe controls", exact: true }).click());
  await test.step("Then: playback alone remains", async () => {
    await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  });
  await test.step("When: Playback controls is hidden", () =>
    page.getByRole("button", { name: "Playback controls", exact: true }).click());
  await test.step("Then: Play disappears without changing the card", async () => {
    await expect(page.getByRole("button", { name: "Play", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Hello");
  });
  await test.step("When: Card details is restored and Help hidden", async () => {
    await page.getByRole("button", { name: "Card details", exact: true }).click();
    await expect(page.getByText("not studied yet", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Help button", exact: true }).click();
    await close();
  });
  await test.step("Then: the help shortcut is absent", () =>
    expect(page.getByRole("button", { name: "Open viewing help" })).toHaveCount(0));
  await test.step("When: Help is restored and opened", async () => {
    await actions();
    await page.getByRole("button", { name: "Help button", exact: true }).click();
    await close();
    await page.getByRole("button", { name: "Open viewing help" }).click();
  });
  await test.step("Then: the real Viewing controls dialog opens", async () => {
    await expect(page.getByRole("dialog", { name: "Viewing controls" })).toBeVisible();
  });
  await test.step("When: Escape closes the help dialog", () => page.keyboard.press("Escape"));
});

test("PLAYWRIGHT-CARD-PLAYER-12 PLAYWRIGHT-CARD-PLAYER-13 preserves reading when its shortcut is hidden", async ({
  page,
}) => {
  const reading = page.getByRole("region", { name: "Card front text" });
  await test.step("Given: Hello has long raw front text", async () => {
    await start(page, "front-reading", { page: "deck" });
    await expect(page.getByRole("button", { name: "View mode", exact: true })).toHaveAttribute("aria-pressed", "false");
  });
  await test.step("When: View mode is enabled", () =>
    page.getByRole("button", { name: "View mode", exact: true }).click());
  await test.step("Then: pressed mode and scrollable focused front appear", async () => {
    await expect(page.getByRole("button", { name: "View mode", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(reading).toBeFocused();
    await scrollable(reading);
  });
  await test.step("When: the mode shortcut is hidden through actions", async () => {
    await page.getByRole("button", { name: "Open card actions" }).click();
    await page.getByRole("button", { name: "View mode", exact: true }).click();
    await page.getByRole("button", { name: "Close card actions" }).click();
  });
  await test.step("Then: reading remains without the shortcut", async () => {
    await expect(page.getByRole("button", { name: "View mode", exact: true })).toHaveCount(0);
    await reading.evaluate((element) => {
      element.scrollTop = 100;
      element.dispatchEvent(new Event("scroll"));
    });
    await expect.poll(() => reading.evaluate((element) => element.scrollTop)).toBe(100);
    await expect(reading).toContainText("Paragraph 1:");
  });
});

test("PLAYWRIGHT-CARD-PLAYER-16 explains unavailable playback without starting it", async ({ page }) => {
  await test.step("Given: the card interval is zero", async () => {
    await start(page, "unavailable", { page: "deck" });
    await page.getByRole("button", { name: "Open card actions" }).click();
  });
  await test.step("When: the unavailable setting is inspected and activated", async () => {
    const toggle = page.getByRole("button", { name: "Playback controls", exact: true });
    await expect(toggle).toHaveAttribute("aria-disabled", "true");
    await expect(toggle).toHaveAccessibleDescription(
      "Playback controls unavailable because the card interval is set to 0"
    );
    await toggle.evaluate((element) => (element as HTMLElement).click());
  });
  await test.step("Then: no playback starts and Hello remains", async () => {
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Hello");
  });
});

for (const [variant, swipe, playback] of [
  ["swipe-only", true, false],
  ["playback-only", false, true],
  ["no-bottom", false, false],
] as const) {
  test(`PLAYWRIGHT-CARD-PLAYER-17 shows only enabled groups: ${variant}`, async ({ page }) => {
    await test.step("Given: the prepared control visibility combination", () => start(page, variant, { page: "deck" }));
    await test.step("When: the Page displays Hello", () =>
      expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Hello"));
    await test.step("Then: only enabled bottom controls appear", async () => {
      await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(swipe ? 1 : 0);
      await expect(page.getByRole("button", { name: "Play", exact: true })).toHaveCount(playback ? 1 : 0);
    });
  });
}

test("PLAYWRIGHT-CARD-PLAYER-19 PLAYWRIGHT-CARD-PLAYER-20 PLAYWRIGHT-CARD-PLAYER-21 accepts one primary drag and rejects middle and secondary drags with hidden buttons", async ({
  page,
}) => {
  await test.step("Given: swipe buttons are hidden and Hello is on the front", async () => {
    await start(page, "gestures", { page: "deck" });
    await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
  });
  await test.step("When: a primary drag includes its trailing click", () =>
    drag(page.getByRole("button", { name: "Card front", exact: true }), 100));
  await test.step("Then: exactly one next card appears on its front", async () => {
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Second");
    await expect(page.getByRole("slider")).toHaveValue("1");
    await expect(page.getByRole("region", { name: "Card answer" })).toHaveCount(0);
  });
  for (const button of [1, 2]) {
    await test.step(`When: button ${button} drags`, () =>
      drag(page.getByRole("button", { name: "Card front", exact: true }), 100, 0, button));
    await test.step("Then: the same card and position remain", async () => {
      await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Second");
      await expect(page.getByRole("slider")).toHaveValue("1");
    });
  }
});

test("PLAYWRIGHT-CARD-PLAYER-18 PLAYWRIGHT-CARD-PLAYER-22 ignores vertical rating gestures and suppresses trailing answer clicks", async ({
  page,
}) => {
  await test.step("Given: Hello's browsing answer is open", async () => {
    await start(page, "list", { page: "deck" });
    await page.getByRole("button", { name: "Card front", exact: true }).click();
  });
  for (const dy of [-100, 100]) {
    await test.step(`When: the answer is dragged vertically by ${dy}`, () =>
      drag(page.getByRole("region", { name: "Card answer" }), 0, dy));
    await test.step("Then: the same answer remains without FSRS rating", async () => {
      await expect(page.getByRole("region", { name: "Card answer" })).toContainText("Hola");
      await expect(page.getByText(/FSRS D:/)).toHaveCount(0);
    });
  }
  await test.step("When: a horizontal answer drag includes its trailing click", () =>
    drag(page.getByRole("region", { name: "Card answer" }), 100));
  await test.step("Then: Second's front appears exactly once", async () => {
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Second");
    await expect(page.getByRole("slider")).toHaveValue("1");
    await expect(page.getByRole("region", { name: "Card answer" })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-CARD-PLAYER-23 distinguishes unstudied cards from numeric FSRS difficulty", async ({ page }) => {
  await test.step("Given: an unstudied and a reviewed card", async () => {
    await start(page, "difficulty", { page: "deck" });
    await expect(page.getByText("not studied yet", { exact: true })).toBeVisible();
    await expect(page.getByText(/FSRS D:/)).toHaveCount(0);
  });
  await test.step("When: the reviewed card is selected", () =>
    page.getByRole("button", { name: "Next card", exact: true }).click());
  await test.step("Then: numeric FSRS replaces unstudied copy on Second", async () => {
    await expect(page.getByText(/FSRS D: \d/)).toBeVisible();
    await expect(page.getByText("not studied yet", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText("Second");
  });
});

for (const input of ["Enter", "Space", "pointer"]) {
  test(`PLAYWRIGHT-CARD-LIST-35 opens a named answer and traps keyboard focus: ${input}`, async ({ page }) => {
    const opener = page.getByRole("button", { name: "View Hello", exact: true });
    const preview = page.getByRole("dialog", { name: "Hello", exact: true });
    await test.step("Given: the opener is reachable in normal Tab order", async () => {
      await start(page);
      for (let stops = 0; stops < 20; stops += 1) {
        if (await opener.evaluate((element) => element === document.activeElement)) break;
        await page.keyboard.press("Tab");
      }
      await expect(opener).toBeFocused();
    });
    await test.step("When: the selected input opens the answer", async () => {
      if (input === "pointer") await opener.click();
      else await page.keyboard.press(input);
    });
    const title = preview.getByRole("heading", { name: "Hello", exact: true });
    await test.step("Then: the named preview owns focus", async () => {
      await expect(preview).toContainText("Hola");
      await expect(title).toBeFocused();
    });
    await test.step("When: focus is requested on the inert background", () =>
      page
        .getByRole("combobox", { name: "Sort order", includeHidden: true })
        .evaluate((element) => (element as HTMLElement).focus()));
    await test.step("Then: the title still owns focus", () => expect(title).toBeFocused());
    for (const [key, target] of [
      ["Tab", preview.getByRole("button", { name: "Close card" })],
      ["Shift+Tab", title],
      ["Shift+Tab", preview.getByRole("region", { name: "Answer", exact: true })],
      ["Tab", title],
    ] as const) {
      await test.step(`When: ${key} traverses the modal`, () => page.keyboard.press(key));
      await test.step("Then: focus stays on the next modal control", () => expect(target).toBeFocused());
    }
    await test.step("When: page shortcuts are pressed inside the modal", async () => {
      await page.keyboard.press("s");
      await page.keyboard.press("t");
    });
    await test.step("Then: the same Card List and preview remain", async () => {
      await expect(preview).toBeVisible();
      await expect(page).toHaveURL(/\/deck\/browse-deck$/);
    });
  });
}

for (const input of ["Escape", "Close card"]) {
  test(`PLAYWRIGHT-CARD-LIST-36 closes with ${input} without changing data or list conditions`, async ({ page }) => {
    let before: unknown;
    const opener = page.getByRole("button", { name: "View Hello", exact: true });
    await test.step("Given: an answer is open with its original entity data and list order", async () => {
      await start(page);
      before = await call(page, "getPreviewState");
      await opener.click();
      await expect(page.getByRole("dialog", { name: "Hello", exact: true })).toContainText("Hola");
    });
    await test.step("When: the selected close input is used", async () => {
      if (input === "Escape") await page.keyboard.press("Escape");
      else await page.getByRole("button", { name: input }).click();
    });
    await test.step("Then: focus and the unchanged list return", async () => {
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(opener).toBeFocused();
      await expect(page.getByRole("combobox", { name: "Sort order" })).toHaveValue("standard");
      expect(await call(page, "getPreviewState")).toBe(before);
    });
  });
}

async function richPreview(page: Page) {
  await start(page, "preview-rich");
  await page.getByRole("button", { name: "View Reading card", exact: true }).click();
  const preview = page.getByRole("dialog", { name: "Reading card", exact: true });
  const reader = preview.getByRole("region", { name: "Answer", exact: true });
  await expect(reader).toBeVisible();
  return { preview, reader };
}

test("PLAYWRIGHT-CARD-LIST-37 selects answer text by dragging without dismissing", async ({ page }) => {
  let preview: Locator;
  let reader: Locator;
  await test.step("Given: an answer contains selectable text", async () => {
    ({ preview, reader } = await richPreview(page));
  });
  await test.step("When: the pointer drags across the rendered text", async () => {
    const box = await reader.getByText("Selectable answer text.", { exact: true }).evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    await page.mouse.move(box.x + 1, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
  });
  await test.step("Then: answer text is selected within the still-open preview", async () => {
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toContain("answer");
    await expect(preview).toBeVisible();
  });
});

test("PLAYWRIGHT-CARD-LIST-38 follows reference, footnote and backlink inside the answer", async ({ page }) => {
  let preview: Locator;
  let reader: Locator;
  await test.step("Given: a rich answer contains an in-page reference and footnote", async () => {
    ({ preview, reader } = await richPreview(page));
  });
  await test.step("When: the reference and backlink are followed", async () => {
    await reader.getByRole("link", { name: "Reference", exact: true }).click();
    await expect(reader.getByText("Footnote answer.", { exact: false })).toBeInViewport();
    await reader.getByRole("link", { name: "Back to reference 1", exact: true }).click();
    await reader.locator("a[data-footnote-ref]").click();
    await expect(reader.getByText("Footnote answer.", { exact: false })).toBeInViewport();
    await reader.getByRole("link", { name: "Back to reference 1", exact: true }).click();
  });
  await test.step("Then: the marker is readable in the same preview", async () => {
    await expect(reader.locator("a[data-footnote-ref]")).toBeInViewport();
    await expect(preview).toBeVisible();
  });
});

test("PLAYWRIGHT-CARD-LIST-39 scrolls a long answer vertically using PageDown", async ({ page }) => {
  let preview: Locator;
  let reader: Locator;
  let before = 0;
  await test.step("Given: a long answer is open", async () => {
    ({ preview, reader } = await richPreview(page));
    await scrollable(reader);
  });
  await test.step("When: the focused reader receives PageDown", async () => {
    await reader.focus();
    before = await reader.evaluate((element) => element.scrollTop);
    await page.keyboard.press("PageDown");
  });
  await test.step("Then: that reader scrolls and the preview stays open", async () => {
    await expect.poll(() => reader.evaluate((element) => element.scrollTop)).toBeGreaterThan(before);
    await expect(preview).toBeVisible();
  });
});

for (const [id, selector] of [
  ["PLAYWRIGHT-CARD-LIST-40", "pre"],
  ["PLAYWRIGHT-CARD-LIST-41", ".katex-display"],
] as const) {
  test(`${id} scrolls wide ${selector === "pre" ? "code" : "math"} using ArrowRight`, async ({ page }) => {
    let preview: Locator;
    let target: Locator;
    await test.step("Given: a wide answer renderer is open", async () => {
      const result = await richPreview(page);
      preview = result.preview;
      target = result.reader.locator(selector);
    });
    await test.step("When: the renderer is focused and ArrowRight is pressed", async () => {
      await target.focus();
      await expect(target).toBeFocused();
      await page.keyboard.press("ArrowRight");
    });
    await test.step("Then: its own horizontal position changes without closing the answer", async () => {
      await expect.poll(() => target.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      await expect(preview).toBeVisible();
    });
  });
}

test("PLAYWRIGHT-CARD-LIST-43 recovers from a missing Deck route", async ({ page }) => {
  await test.step("Given: the requested Deck is absent", () => start(page, "list", { missing: "1" }));
  await test.step("When: its missing route renders", () =>
    expect(page.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible());
  await test.step("When: Go home is chosen", () => page.getByRole("button", { name: "Go home" }).click());
  await test.step("Then: the Deck list is reached", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Decks", exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-CARD-LIST-44 cancels deletion and restores the exact trigger without changing data", async ({
  page,
}) => {
  let before: unknown;
  const trigger = page.getByRole("button", { name: "Open actions for Hello", exact: true });
  await test.step("Given: Hello's irreversible deletion is being confirmed", async () => {
    await start(page);
    before = await call(page, "getPreviewState");
    await trigger.click();
    await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toContainText("Hello");
    await expect(page.getByRole("alertdialog")).toContainText("cannot be undone");
  });
  await test.step("When: Cancel is selected", () =>
    page.getByRole("alertdialog").getByRole("button", { name: "Cancel", exact: true }).click());
  await test.step("Then: focus returns and the original Card remains unchanged", async () => {
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await call(page, "getPreviewState")).toBe(before);
  });
});

for (const filtered of [false, true]) {
  test(`PLAYWRIGHT-CARD-LIST-26 PLAYWRIGHT-CARD-LIST-27 PLAYWRIGHT-CARD-LIST-28 stable sorting ${filtered ? "with" : "without"} a filter`, async ({
    page,
  }) => {
    let before: unknown;
    const sort = page.getByRole("combobox", { name: "Sort order" });
    const standard = ["oldest question", "newest question", ...(filtered ? [] : ["tied question"])];
    const newest = ["newest question", ...(filtered ? [] : ["tied question"]), "oldest question"];
    const expectOrder = async (names: string[]) => {
      await expect(page.getByRole("button", { name: /^View / })).toHaveCount(names.length);
      for (const [index, name] of names.entries())
        await expect(page.getByRole("button", { name: /^View / }).nth(index)).toHaveAccessibleName(`View ${name}`);
    };
    await test.step("Given: distinct creation times, stable ties and a running session", async () => {
      await start(page, filtered ? "sort-filtered" : "sort");
      await expectOrder(standard);
      before = await call(page, "getPreviewState");
      await sort.focus();
    });
    await test.step("When: newest order is chosen using the keyboard", async () => {
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Tab");
    });
    await test.step("Then: creation time sorts with stable ties and the same count", async () => {
      await expect(sort).toHaveValue("newest");
      await expectOrder(newest);
      await expect(page.getByText(`${newest.length} cards`, { exact: true })).toBeVisible();
    });
    await test.step("When: the oldest Card is previewed and closed", async () => {
      await page.getByRole("button", { name: "View oldest question", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "oldest question", exact: true })).toContainText("oldest answer");
      await page.getByRole("button", { name: "Close card" }).click();
    });
    await test.step("Then: sorting and all Entity, preferences and session data remain unchanged", async () => {
      await expect(sort).toHaveValue("newest");
      expect(await call(page, "getPreviewState")).toBe(before);
    });
    await test.step("When: Standard is restored by keyboard", async () => {
      await sort.focus();
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("Tab");
    });
    await test.step("Then: the standard relative order and data return", async () => {
      await expect(sort).toHaveValue("standard");
      await expectOrder(standard);
      expect(await call(page, "getPreviewState")).toBe(before);
    });
  });
}

test("PLAYWRIGHT-CARD-LIST-31 resets sorting after leaving and returning through browser history", async ({ page }) => {
  let before: unknown;
  const sort = page.getByRole("combobox", { name: "Sort order" });
  await test.step("Given: newest order is selected", async () => {
    await start(page, "sort");
    await sort.selectOption("newest");
    before = await call(page, "getPreviewState");
  });
  await test.step("When: tango navigates home and browser Back returns", async () => {
    await page.getByRole("button", { name: "tango", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
    await page.goBack();
  });
  await test.step("Then: sorting resets to Standard without changing data", async () => {
    await expect(sort).toHaveValue("standard");
    expect(await call(page, "getPreviewState")).toBe(before);
  });
});

async function expectList(page: Page, names: readonly string[]) {
  await expect(page.getByRole("button", { name: /^View / })).toHaveCount(names.length);
  for (const name of names) await expect(page.getByRole("button", { name: `View ${name}`, exact: true })).toBeVisible();
  await expect(
    page.getByText(`${names.length} ${names.length === 1 ? "card" : "cards"}`, { exact: true })
  ).toBeVisible();
}
async function expectDeckView(page: Page, names: readonly string[]) {
  const seen: string[] = [];
  for (let i = 0; i < names.length; i++) {
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuetext", `${i + 1} of ${names.length}`);
    seen.push(await page.getByRole("button", { name: "Card front", exact: true }).innerText());
    if (i + 1 < names.length) await page.getByRole("button", { name: "Next card", exact: true }).click();
  }
  expect(seen.toSorted()).toEqual([...names].toSorted());
}
const mixedNames = ["due tagged card", "future tagged card", "new tagged card", "excluded study tag card"];
for (const scenario of [
  { tags: ["target"], all: false, names: mixedNames.slice(0, 3) },
  { tags: ["alpha", "beta"], all: true, names: ["new tagged card"] },
  { tags: ["alpha", "beta"], all: false, names: mixedNames.slice(0, 3) },
]) {
  test(`PLAYWRIGHT-DECK-VIEW-05 applies ${scenario.tags.join("+")} ${scenario.all ? "All" : "Any"} consistently to both browsing pages`, async ({
    page,
  }) => {
    let before: unknown;
    await test.step("Given: due, future, unstudied and study-excluded cards are available", async () => {
      await start(page, "mixed");
      await expectList(page, mixedNames);
      before = await call(page, "getNonFilterState");
    });
    await test.step("When: the scenario tags and matching mode are selected", async () => {
      await filters(page).click();
      for (const tag of scenario.tags)
        await page.getByRole("checkbox", { name: tag, exact: true }).locator("..").click();
      if (scenario.all) await page.getByRole("radio", { name: "All", exact: true }).locator("..").click();
    });
    await test.step("Then: the list contains exactly the matching cards", () => expectList(page, scenario.names));
    await test.step("When: the real router opens Deck View", () => call(page, "navigate", "/deck/browse-deck/view"));
    await test.step("Then: the same cards are viewed without other Entity changes", async () => {
      await expectDeckView(page, scenario.names);
      expect(await call(page, "getNonFilterState")).toBe(before);
    });
  });
}

test("PLAYWRIGHT-DECK-VIEW-04 PLAYWRIGHT-DECK-VIEW-10 isolates browsing from study conditions and other Deck filters", async ({
  page,
}) => {
  let before: unknown;
  await test.step("Given: the first Deck has All filters and another has no browsing filter", async () => {
    await start(page, "mixed-all");
    await expectList(page, ["new tagged card"]);
    before = await call(page, "getPreviewState");
  });
  await test.step("When: another Deck's list and filters open", async () => {
    await call(page, "navigate", "/deck/browse-other");
    await expectList(page, ["future only card"]);
    await filters(page).click();
  });
  await test.step("Then: Any with no checked tags is independent", async () => {
    await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
  });
  await test.step("When: that Deck View opens", () => call(page, "navigate", "/deck/browse-other/view"));
  await test.step("Then: its future card remains available without data changes", async () => {
    await expectDeckView(page, ["future only card"]);
    expect(await call(page, "getPreviewState")).toBe(before);
  });
  await test.step("When: the original Deck is revisited", () => call(page, "navigate", "/deck/browse-deck"));
  await test.step("Then: its own All filter still applies", async () => {
    await expectList(page, ["new tagged card"]);
  });
  await test.step("When: the original filters are reopened", () => filters(page).click());
  await test.step("Then: the original All selection remains", async () => {
    await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "alpha", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "beta", exact: true })).toBeChecked();
  });
});

test("PLAYWRIGHT-CARD-LIST-49 PLAYWRIGHT-DECK-VIEW-07 clears no-match conditions and restores both browsing pages", async ({
  page,
}) => {
  let before: unknown;
  await test.step("Given: two unavailable tags with All match no cards", async () => {
    await start(page, "mixed-missing");
    before = await call(page, "getNonFilterState");
    await expect(page.getByRole("heading", { name: "No cards match the active filters" })).toBeVisible();
    await expect(page.getByText("0 cards", { exact: true })).toBeVisible();
  });
  await test.step("When: the filters are opened and Clear is selected", async () => {
    await filters(page).click();
    await expect(page.getByRole("checkbox", { name: "missing", exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Clear", exact: true }).click();
  });
  await test.step("Then: Any with no tags displays every Card", async () => {
    await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
    await expectList(page, mixedNames);
  });
  await test.step("When: the cleared Deck View opens", () => call(page, "navigate", "/deck/browse-deck/view"));
  await test.step("Then: all four cards are viewable without unrelated data changes", async () => {
    await expectDeckView(page, mixedNames);
    expect(await call(page, "getNonFilterState")).toBe(before);
  });
});

test("PLAYWRIGHT-CARD-LIST-50 PLAYWRIGHT-CARD-LIST-51 removes the last tag assignment and individually clears the retained orphan selection", async ({
  page,
}) => {
  await test.step("Given: one of two cards has kept and only another Deck has other-only", async () => {
    await start(page, "orphan");
    await filters(page).click();
    await expect(page.getByRole("checkbox", { name: "shared", exact: true })).toHaveCount(1);
    await expect(page.getByRole("checkbox", { name: "other-only", exact: true })).toHaveCount(0);
  });
  await test.step("When: kept is selected and Deck View opened", async () => {
    await page.getByRole("checkbox", { name: "kept", exact: true }).locator("..").click();
    await expect(page.getByRole("button", { name: /^View / })).toHaveCount(1);
    await call(page, "navigate", "/deck/browse-deck/view");
  });
  await test.step("Then: exactly one matching card is viewable", () =>
    expect(page.getByRole("slider")).toHaveAttribute("aria-valuetext", "1 of 1"));
  await test.step("When: the last assignment is removed through the real Card editor and saved", async () => {
    await call(page, "navigate", "/card/browse-card-0/edit");
    await page.getByRole("button", { name: "Edit tags", exact: true }).click();
    await page.getByRole("button", { name: "Remove tag 2", exact: true }).click();
    await page.getByRole("button", { name: "Close tag editor", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page).toHaveURL(/\/deck\/browse-deck$/);
  });
  await test.step("Then: no matching rows remain but the orphan checkbox remains checked", async () => {
    await expect(page.getByRole("button", { name: /^View / })).toHaveCount(0);
  });
  await test.step("When: filters are reopened", () => filters(page).click());
  await test.step("Then: the orphan checkbox remains checked", async () => {
    await expect(page.getByRole("checkbox", { name: "kept", exact: true })).toBeChecked();
  });
  await test.step("When: only that checkbox is toggled off", () =>
    page.getByRole("checkbox", { name: "kept", exact: true }).locator("..").click());
  await test.step("Then: the unused candidate disappears and both cards return", async () => {
    await expect(page.getByRole("checkbox", { name: "kept", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^View / })).toHaveCount(2);
  });
  await test.step("When: the unfiltered Deck View opens", () => call(page, "navigate", "/deck/browse-deck/view"));
  await test.step("Then: the same two cards begin at one of two", () =>
    expect(page.getByRole("slider")).toHaveAttribute("aria-valuetext", "1 of 2"));
});

test("PLAYWRIGHT-CARD-LIST-01 PLAYWRIGHT-CARD-LIST-05 PLAYWRIGHT-CARD-LIST-08 PLAYWRIGHT-CARD-LIST-19 reports public row and list callback values", async ({
  page,
}) => {
  await test.step("Given: the real Card List presentation has two identified rows", () =>
    start(page, "list-component:callbacks"));
  await test.step("When: Add card, a preview and a sort change are requested", async () => {
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add card" }).click();
    await page.getByRole("button", { name: "View Hello", exact: true }).click();
    await page.getByRole("combobox", { name: "Sort order" }).selectOption("newest");
  });
  await test.step("Then: each callback has its exact public value", async () =>
    expect(await observations(page)).toEqual([
      { name: "add" },
      { name: "view", value: "browse-card-0" },
      { name: "sort", value: "newest" },
    ]));
  await test.step("When: Second's row Edit is selected", async () => {
    await page.getByRole("button", { name: "Open actions for Second", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  });
  await test.step("Then: the selected row id is reported", async () =>
    expect(((await observations(page)) as unknown[]).at(-1)).toEqual({ name: "edit", value: "browse-card-1" }));
});

test("PLAYWRIGHT-CARD-LIST-07 reports one public close callback", async ({ page }) => {
  await test.step("Given: the real list presentation has a preview", () => start(page, "list-component:preview"));
  await test.step("When: its Close card action is selected", () =>
    page.getByRole("button", { name: "Close card" }).click());
  await test.step("Then: Close is reported once and its control disappears", async () => {
    expect(await observations(page)).toEqual([{ name: "close" }]);
    await expect(page.getByRole("button", { name: "Close card" })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-CARD-LIST-48 navigates once with t and s while preserving Entity and session data", async ({
  page,
}) => {
  let before: unknown;
  await test.step("Given: the list has cards and a running session without an input or dialog", async () => {
    await start(page, "sort");
    before = await call(page, "getPreviewState");
  });
  await test.step("When: t is pressed", () => page.keyboard.press("t"));
  await test.step("Then: the Deck list opens", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
  });
  await test.step("When: Back returns to the list and s is pressed", async () => {
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
    await page.keyboard.press("s");
  });
  await test.step("Then: Settings opens without changing the prepared data", async () => {
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    expect(await call(page, "getPreviewState")).toBe(before);
  });
});

test("PLAYWRIGHT-CARD-VIEW-04 PLAYWRIGHT-CARD-VIEW-05 consumes a changed Card route inside the application shell", async ({
  page,
}) => {
  await test.step("Given: the first Card route is open in the shell", async () => {
    await start(page, "list", { page: "card" });
    await expect(page.getByRole("region", { name: "Card answer" })).toContainText("Hola");
    await expect(page.getByRole("button", { name: "tango", exact: true })).toBeVisible();
  });
  await test.step("When: same-document browser history changes the Card id", () =>
    call(page, "navigate", "/card/browse-card-1"));
  await test.step("Then: the new answer appears in the same shell", async () => {
    await expect(page).toHaveURL(/\/card\/browse-card-1$/);
    await expect(page.getByRole("region", { name: "Card answer" })).toContainText("Second answer");
    await expect(page.getByRole("region", { name: "Card answer" })).not.toContainText("Hola");
    await expect(page.getByRole("button", { name: "tango", exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-CARD-LIST-49 preserves two active All filters that match no cards in both browsing pages", async ({
  page,
}) => {
  let before: unknown;
  await test.step("Given: target and other are both selected with All", async () => {
    await start(page, "mixed-no-match");
    before = await call(page, "getPreviewState");
  });
  await test.step("When: the list and its filters are opened", async () => {
    await expectList(page, []);
    await expect(page.getByRole("heading", { name: "No cards match the active filters" })).toBeVisible();
    await filters(page).click();
  });
  await test.step("Then: both filters remain selected with a usable clear action", async () => {
    await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Clear filters" }).first()).toBeEnabled();
  });
  await test.step("When: the same Deck opens in View mode", () => call(page, "navigate", "/deck/browse-deck/view"));
  await test.step("Then: matching zero stays distinct from no cards without changing data", async () => {
    await expect(page.getByRole("heading", { name: "No cards match the current filters." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Card front", exact: true })).toHaveCount(0);
    expect(await call(page, "getPreviewState")).toBe(before);
  });
});

for (const filtered of [false, true]) {
  test(`PLAYWRIGHT-CARD-LIST-31 restores Standard on reload and Deck View ignores transient list sorting ${filtered ? "filtered" : "all"}`, async ({
    page,
  }) => {
    const standard = ["oldest question", "newest question", ...(filtered ? [] : ["tied question"])];
    let before: unknown;
    await test.step("Given: newest order in the filtered or unfiltered real list", async () => {
      await start(page, filtered ? "sort-filtered" : "sort");
      before = await call(page, "getPreviewState");
      await page.getByRole("combobox", { name: "Sort order" }).selectOption("newest");
      expect(await call(page, "getPreviewState")).toBe(before);
    });
    await test.step("When: the real application route reloads", () => page.reload());
    await test.step("Then: Standard order returns with the prepared data", async () => {
      await expect(page.getByRole("combobox", { name: "Sort order" })).toHaveValue("standard");
      for (const [i, name] of standard.entries())
        await expect(page.getByRole("button", { name: /^View / }).nth(i)).toHaveAccessibleName(`View ${name}`);
      expect(await call(page, "getPreviewState")).toBe(before);
    });
    await test.step("When: newest is selected and Deck View is opened", async () => {
      await page.getByRole("combobox", { name: "Sort order" }).selectOption("newest");
      await call(page, "navigate", "/deck/browse-deck/view");
    });
    await test.step("Then: View starts with the standard oldest Card without data changes", async () => {
      await expect(page.getByRole("button", { name: "Card front", exact: true })).toHaveText("oldest question");
      expect(await call(page, "getPreviewState")).toBe(before);
    });
  });
}

for (const other of [false, true]) {
  test(`PLAYWRIGHT-DECK-VIEW-10 browses ${other ? "future-only" : "mixed review states"} without study filtering`, async ({
    page,
  }) => {
    let before: unknown;
    const names = other ? ["future only card"] : mixedNames;
    const id = other ? "browse-other" : "browse-deck";
    await test.step("Given: study interval, shuffle and one-card limit are enabled", async () => {
      await start(page, "mixed");
      if (other) await call(page, "navigate", `/deck/${id}`);
      before = await call(page, "getPreviewState");
    });
    await test.step("When: the unfiltered browsing list opens its filter controls", async () => {
      await expectList(page, names);
      await filters(page).click();
    });
    await test.step("Then: Any and zero checked tags apply independently of study", async () => {
      await expect(page.getByRole("radio", { name: "Any", exact: true })).toBeChecked();
      await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
    });
    await test.step("When: Deck View is opened", () => call(page, "navigate", `/deck/${id}/view`));
    await test.step("Then: all of the Deck's cards remain viewable without changing data", async () => {
      await expectDeckView(page, names);
      expect(await call(page, "getPreviewState")).toBe(before);
    });
  });
}

for (const [variant, button] of [
  ["empty-add", "Add card"],
  ["empty-clear", "Clear filters"],
] as const) {
  test(`PLAYWRIGHT-CARD-LIST-${variant === "empty-add" ? "17" : "18"} reports one public ${variant} request`, async ({
    page,
  }) => {
    await test.step("Given: the explicit empty presentation has its matching recovery callback", () =>
      start(page, `list-component:${variant}`));
    await test.step("When: the empty-state recovery action is selected", () =>
      page.getByRole("button", { name: button, exact: true }).click());
    await test.step("Then: its callback is called exactly once", async () =>
      expect(await observations(page)).toEqual([{ name: variant }]));
  });
}

test("PLAYWRIGHT-CARD-LIST-19 displays both tags and edits the identified row", async ({ page }) => {
  await test.step("Given: Third has A and B tags in the real Card List", async () => {
    await start(page);
    const row = page
      .getByRole("article")
      .filter({ has: page.getByRole("button", { name: "View Third", exact: true }) });
    await expect(row.getByText("Third", { exact: true })).toBeVisible();
    await expect(row.getByRole("group", { name: "Tags: A, B" })).toBeVisible();
    await expect(row.getByText("A", { exact: true })).toBeVisible();
    await expect(row.getByText("B", { exact: true })).toBeVisible();
  });
  await test.step("When: that row's Edit is selected", async () => {
    await page.getByRole("button", { name: "Open actions for Third", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  });
  await test.step("Then: the Third Card editor opens", () =>
    expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue("Third"));
});
