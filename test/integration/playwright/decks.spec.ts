import type { Page } from "@playwright/test";
import * as Papa from "papaparse";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { callScenario, expect, open, test } from "./fixtures";

const deckName = "Japanese verbs";
const otherName = "Other deck";
const launch = (page: Page, variant = "list", params: Record<string, string> = {}) =>
  open(page, "decks", variant, params);
const inspect = (page: Page) => callScenario(page, "decks", "inspect");
const csvFile = (text = "front,back,,key-1\n", name = "deck.csv") => ({
  name,
  mimeType: "text/csv",
  buffer: Buffer.from(text),
});

test("PLAYWRIGHT-DECK-LIST-01 PLAYWRIGHT-DECK-LIST-02 PLAYWRIGHT-DECK-LIST-11 PLAYWRIGHT-DECK-LIST-12 Add navigation and keyboard focus", async ({
  page,
}) => {
  await test.step("Given: a populated deck list", async () => {
    await launch(page);
  });
  const add = page.getByRole("button", { name: "Add", exact: true });
  await test.step("When: Enter opens Add and arrow keys move to import", async () => {
    await add.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Create deck" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
  });
  await test.step("Then: Escape closes without navigating and restores focus", async () => {
    await expect(page.getByRole("menuitem", { name: "Import decks" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(add).toBeFocused();
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
  });
  await test.step("When: creation is selected", async () => {
    await add.click();
    await page.getByRole("menuitem", { name: "Create deck" }).click();
  });
  await test.step("Then: the creation route has a name input", async () => {
    await expect(page.getByRole("heading", { name: "Create deck", exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Name", exact: true })).toBeVisible();
  });
  await test.step("When: returning and choosing import", async () => {
    await page.getByRole("button", { name: "tango", exact: true }).click();
    await expect(page.getByRole("menu")).toHaveCount(0);
    await add.click();
    await page.getByRole("menuitem", { name: "Import decks" }).click();
  });
  await test.step("Then: import opens with an enabled file input", async () => {
    await expect(page.getByRole("heading", { name: "Add a deck" })).toBeVisible();
    await expect(page.getByLabel("Upload a csv file")).toBeEnabled();
  });
});

test("PLAYWRIGHT-DECK-LIST-03 Japanese controls retain user deck names", async ({ page }) => {
  const setup = await test.step("Given: Japanese is selected", async () => ({ variant: "list", language: "ja" }));
  await test.step("When: the deck list is displayed", async () => {
    await launch(page, setup.variant, { language: setup.language });
  });
  await test.step("Then: fixed labels translate and names do not", async () => {
    await expect(page.getByRole("heading", { name: "デッキ", exact: true })).toBeVisible();
    await expect(page.getByRole("article", { name: deckName })).toContainText(deckName);
    await expect(page.getByRole("button", { name: `${deckName}を学習`, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "追加", exact: true }).click();
    await expect(page.getByRole("menuitem", { name: "デッキを作成" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "デッキをインポート" })).toBeVisible();
  });
});

test("PLAYWRIGHT-DECK-LIST-05 Empty results keep all creation choices available", async ({ page }) => {
  await test.step("Given: no decks and completed bootstrap", async () => {
    await launch(page, "empty");
  });
  await test.step("When: the list and Add menu are displayed", async () => {
    await expect(page.getByText("0 decks", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No decks yet" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create deck", exact: true })).toBeEnabled();
    await expect(
      page
        .getByRole("region", { name: "No decks yet", exact: true })
        .getByRole("button", { name: "Import decks", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Add", exact: true }).click();
  });
  await test.step("Then: both Add choices are enabled", async () => {
    await expect(page.getByRole("menuitem", { name: "Create deck" })).toBeEnabled();
    await expect(page.getByRole("menuitem", { name: "Import decks" })).toBeEnabled();
  });
});

test("PLAYWRIGHT-DECK-LIST-13 Pending sample bootstrap is not an empty result", async ({ page }) => {
  const variant = await test.step("Given: sample creation is waiting on external I/O", async () => "checking");
  await test.step("When: the deck list is displayed", async () => {
    await launch(page, variant);
  });
  await test.step("Then: checking is shown without a confirmed empty message", async () => {
    await expect(page.getByText("Checking for sample deck…")).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Checking for sample deck…" })).toHaveText(
      "Checking for sample deck…"
    );
    await expect(page.getByRole("heading", { name: "No decks yet" })).toHaveCount(0);
  });
});

for (const action of ["Retry", "Create deck", "Import decks"]) {
  test(`PLAYWRIGHT-DECK-LIST-14 Bootstrap failure recovery: ${action}`, async ({ page }) => {
    await test.step("Given: sample bootstrap has failed", async () => {
      await launch(page, "bootstrap-failure");
      await expect(page.getByRole("heading", { name: "Unable to load sample deck" })).toBeVisible();
      await expect(page.getByRole("alert").filter({ hasText: "Unable to load sample deck" })).toBeVisible();
    });
    await test.step("When: a recovery action is selected", async () => {
      await page
        .getByRole("alert", { name: "Unable to load sample deck", exact: true })
        .getByRole("button", { name: action, exact: true })
        .click();
    });
    await test.step("Then: the requested recovery route or sample is usable", async () => {
      if (action === "Retry") {
        await expect(page.getByRole("button", { name: "Study Sample Deck" })).toBeEnabled();
        await expect(page.getByRole("heading", { name: "Unable to load sample deck" })).toHaveCount(0);
        await page.getByRole("button", { name: "Study Sample Deck" }).click();
        await expect(page.getByRole("heading", { name: "Sample Deck", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: /Start .* cards/ })).toBeEnabled();
      } else {
        await expect(
          page.getByRole("heading", { name: action === "Create deck" ? "Create deck" : "Add a deck", exact: true })
        ).toBeVisible();
      }
    });
  });
}

test("PLAYWRIGHT-DECK-LIST-06 Review counts and their explanation use all loaded decks", async ({ page }) => {
  await test.step("Given: two due and three new cards in the first deck", async () => {
    await launch(page, "review");
  });
  await test.step("When: the count explanation is opened", async () => {
    await expect(
      page.getByRole("article", { name: deckName }).getByText("2 due · 3 new", { exact: true })
    ).toBeVisible();
    await page.getByText("About counts", { exact: true }).click();
  });
  await test.step("Then: totals and the source of counts are visible", async () => {
    await expect(page.getByText("2 due · 4 new", { exact: true })).toBeVisible();
    await expect(page.getByText("Counts use data currently held on this device and saved filters.")).toBeVisible();
  });
});

for (const reason of ["no-held", "no-matches", "future"] as const) {
  test(`PLAYWRIGHT-DECK-LIST-15 Explain zero review cards: ${reason}`, async ({ page }) => {
    await test.step("Given: a deck with the corresponding zero-review reason", async () => {
      await launch(page, reason);
    });
    const row = page.getByRole("article", { name: deckName });
    const message =
      reason === "no-held"
        ? "No cards held on this device"
        : reason === "no-matches"
          ? "No cards match saved filters"
          : "Next review: Jul 2, 2026, 12:00 PM";
    await test.step("When: the reason disclosure is opened", async () => {
      await expect(row.getByText(message, { exact: true })).toBeHidden();
      await row.getByText("No due or new cards", { exact: true }).click();
    });
    await test.step("Then: the specific explanation and Study action remain available", async () => {
      await expect(row.getByText(message, { exact: true })).toBeVisible();
      await expect(row.getByRole("button", { name: `Study ${deckName}`, exact: true })).toBeEnabled();
    });
  });
}

test("PLAYWRIGHT-DECK-LIST-15 Distinguish new cards from waiting for a review", async ({ page }) => {
  await test.step("Given: new cards and a separate future-review deck", async () => {
    await launch(page, "zero-review");
  });
  await test.step("When: the future review reason is expanded", async () => {
    await page.getByRole("article", { name: otherName }).getByText("No due or new cards").click();
  });
  await test.step("Then: fresh and future-review cards offer different actions", async () => {
    const fresh = page.getByRole("article", { name: deckName });
    await expect(fresh.getByText("0 due · 5 new", { exact: true })).toBeVisible();
    await expect(fresh.getByRole("button", { name: `Study new cards in ${deckName}` })).toBeEnabled();
    const waiting = page.getByRole("article", { name: otherName });
    await expect(waiting.getByText(/Next review:/)).toBeVisible();
    await expect(waiting.getByRole("button", { name: `Study new cards in ${otherName}` })).toHaveCount(0);
  });
});

for (const [name, button, count] of [
  [deckName, `Review ${deckName}`, "Start 5 cards"],
  [otherName, `Study new cards in ${otherName}`, "Start 1 card"],
]) {
  test(`PLAYWRIGHT-DECK-LIST-16 PLAYWRIGHT-DECK-LIST-18 PLAYWRIGHT-DECK-LIST-19 Study targets ${name}`, async ({
    page,
  }) => {
    await test.step("Given: due and new cards belong to distinct decks", async () => {
      await launch(page, "review");
    });
    await test.step("When: the primary study action is selected", async () => {
      await page.getByRole("button", { name: button!, exact: true }).click();
    });
    await test.step("Then: only the selected deck's study setup is opened", async () => {
      await expect(page.getByRole("heading", { name: name!, exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: count!, exact: true })).toBeEnabled();
      await expect(page.getByRole("slider", { name: "Viewing progress" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Card front" })).toHaveCount(0);
      expect((await inspect(page)) as unknown).toMatchObject({ studyRequests: [] });
    });
  });
}

test("PLAYWRIGHT-DECK-LIST-18 Primary study does not activate the card-list row", async ({ page }) => {
  await test.step("Given: a deck with 24 held cards", async () => {
    await launch(page, "study-without-opening");
  });
  const historyLength = await page.evaluate(() => history.length);
  await test.step("When: the Study button is selected", async () => {
    await expect(page.getByText("24 cards", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: `Study ${deckName}`, exact: true }).click();
  });
  await test.step("Then: study setup is shown without the Cards heading", async () => {
    await expect(page.getByRole("heading", { name: deckName, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start 10 cards" })).toBeEnabled();
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => history.length)).toBe(historyLength + 1);
  });
});

for (const [variant, cardCount, total, position] of [
  ["active", 5, 5, 3],
  ["position", 8, 3, 2],
  ["unknown-time", 2, 2, 2],
] as const) {
  test(`PLAYWRIGHT-DECK-LIST-09 PLAYWRIGHT-DECK-LIST-17 Study position: ${variant}`, async ({ page }) => {
    const prepared = await test.step("Given: an active session and an unstarted deck", async () => variant);
    await test.step("When: the deck list is displayed", async () => {
      await launch(page, prepared);
    });
    await test.step("Then: position, card counts, and accessible description are distinct", async () => {
      await expect(page.getByRole("region", { name: "Decks", exact: true }).getByRole("article")).toHaveCount(2);
      const active = page.getByRole("article", { name: deckName });
      await expect(active.getByText(`${cardCount} cards`, { exact: true })).toBeVisible();
      await expect(active.getByText(`Studying · Card ${position} of ${total}`, { exact: true })).toBeVisible();
      await expect(active.getByRole("button", { name: `Open cards in ${deckName}` })).toHaveAccessibleDescription(
        `${cardCount} cards Studying · Card ${position} of ${total}`
      );
      await expect(active.getByRole("button", { name: `Continue ${deckName}` })).toBeVisible();
      await expect(active.getByRole("progressbar")).toHaveCount(0);
      await expect(active.getByText("math", { exact: true })).toHaveCount(0);
      await expect(active.getByText(/Last studied|Last review/)).toHaveCount(0);
      const other = page.getByRole("article", { name: otherName });
      await expect(other.getByText(/Studying ·/)).toHaveCount(0);
      await expect(other.getByRole("button", { name: `Study ${otherName}`, exact: true })).toBeVisible();
    });
  });
}

for (const operation of ["View", "Edit", "Study history", "Open cards", "Continue", "Restart", "Delete"] as const) {
  test(`PLAYWRIGHT-DECK-LIST-04 PLAYWRIGHT-DECK-LIST-08 PLAYWRIGHT-DECK-LIST-19 Targeted operation: ${operation}`, async ({
    page,
  }) => {
    await test.step("Given: distinct decks and an active session in the selected deck", async () => {
      await launch(page, "active");
    });
    const selected = deckName;
    await test.step("When: the selected deck's operation is chosen", async () => {
      if (operation === "Open cards") await page.getByRole("button", { name: `Open cards in ${selected}` }).click();
      else if (operation === "Continue") await page.getByRole("button", { name: `Continue ${selected}` }).click();
      else {
        await page.getByRole("button", { name: `Open actions for ${selected}` }).click();
        await page.getByRole("menuitem", { name: operation, exact: true }).click();
      }
    });
    await test.step("Then: the operation uses the target deck and does not start a new session", async () => {
      if (operation === "View") {
        await expect(page.getByRole("button", { name: "Card front" })).toContainText("Hello");
        await expect(page.getByText("Other prompt", { exact: true })).toHaveCount(0);
        await expect(page.getByRole("slider", { name: "Viewing progress" })).toHaveAttribute(
          "aria-valuetext",
          "1 of 5"
        );
      } else if (operation === "Edit") {
        await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(selected);
        await expect(page.getByRole("combobox", { name: "Display format" })).toHaveValue("math");
      } else if (operation === "Study history") {
        await expect(page.getByRole("heading", { name: "Study history", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "30 days", exact: true })).toBeVisible();
      } else if (operation === "Open cards") {
        await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
        await expect(page.getByText("Hello", { exact: true }).first()).toBeVisible();
        await expect(page.getByText("Other prompt", { exact: true })).toHaveCount(0);
      } else if (operation === "Continue") {
        await expect(page.getByRole("button", { name: "Third", exact: true })).toBeVisible();
        expect((await inspect(page)) as unknown).toMatchObject({ touchedDecks: ["contract-deck", "contract-deck"] });
      } else if (operation === "Restart") {
        await expect(page.getByRole("heading", { name: selected, exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Start 5 cards" })).toBeEnabled();
      } else {
        await expect(page.getByRole("alertdialog")).toContainText(selected);
        await expect(page.getByRole("alertdialog")).not.toContainText(otherName);
        await page.getByRole("alertdialog").getByRole("button", { name: "Delete deck", exact: true }).click();
        await expect(page.getByRole("article", { name: selected })).toHaveCount(0);
        await expect(page.getByRole("article", { name: otherName })).toBeVisible();
        expect((await inspect(page)) as unknown).toMatchObject({ deletedDecks: ["contract-deck"] });
      }
      expect((await inspect(page)) as unknown).toMatchObject({ studyRequests: [] });
    });
  });
}

test("PLAYWRIGHT-DECK-LIST-04 PLAYWRIGHT-DECK-LIST-19 Browse and edit the other deck", async ({ page }) => {
  await test.step("Given: a second deck with a different card and display format", async () => {
    await launch(page);
  });
  await test.step("When: View is selected on the second deck", async () => {
    await page.getByRole("button", { name: `Open actions for ${otherName}` }).click();
    await page.getByRole("menuitem", { name: "View", exact: true }).click();
  });
  await test.step("Then: only that deck's card is viewed", async () => {
    await expect(page.getByRole("button", { name: "Card front" })).toContainText("Other prompt");
    await expect(page.getByText("Hello", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("slider", { name: "Viewing progress" })).toHaveAttribute("aria-valuetext", "1 of 1");
  });
  await test.step("When: returning to edit the same second deck", async () => {
    await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
    await page.getByRole("button", { name: `Open actions for ${otherName}` }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  });
  await test.step("Then: its saved values are shown", async () => {
    await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(otherName);
    await expect(page.getByRole("combobox", { name: "Display format" })).toHaveValue("python");
  });
});

test("PLAYWRIGHT-DECK-LIST-10 Add and deck menus are mutually exclusive", async ({ page }) => {
  await test.step("Given: two decks", async () => {
    await launch(page);
  });
  for (const name of [
    `Open actions for ${deckName}`,
    `Open actions for ${otherName}`,
    "Add",
    `Open actions for ${deckName}`,
  ]) {
    await test.step("When: another menu trigger is activated", async () => {
      await page.getByRole("button", { name, exact: true }).click();
    });
    await test.step("Then: exactly one menu remains and its trigger is expanded", async () => {
      await expect(page.getByRole("menu")).toHaveCount(1);
      await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-expanded", "true");
    });
  }
});

for (const active of [false, true]) {
  test(`PLAYWRIGHT-DECK-LIST-22 PLAYWRIGHT-DECK-LIST-23 Deck menu keyboard and restart: active=${active}`, async ({
    page,
  }) => {
    await test.step("Given: the selected deck has the stated study status", async () => {
      await launch(page, active ? "active" : "list");
    });
    const trigger = page.getByRole("button", { name: `Open actions for ${deckName}` });
    await test.step("When: the deck menu is opened", async () => {
      await trigger.click();
    });
    await test.step("Then: its initial focus and ordered actions match the study status", async () => {
      await expect(page.getByRole("menuitem")).toHaveText(
        active
          ? ["View", "Restart", "Download", "Edit", "Study history", "Delete"]
          : ["View", "Download", "Edit", "Study history", "Delete"]
      );
      await expect(page.getByRole("menuitem", { name: "View", exact: true })).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("menuitem", { name: active ? "Restart" : "Download", exact: true })).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByRole("menuitem", { name: "View", exact: true })).toBeFocused();
      await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
      if (!active) await expect(page.getByRole("button", { name: `Study ${deckName}`, exact: true })).toBeEnabled();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  });
}

test("PLAYWRIGHT-DECK-LIST-25 Moving focus outside a menu preserves its destination", async ({ page }) => {
  await test.step("Given: an open deck menu", async () => {
    await launch(page);
    await page.getByRole("button", { name: `Open actions for ${deckName}` }).click();
    await expect(page.getByRole("menuitem", { name: "View", exact: true })).toBeFocused();
  });
  await test.step("When: focus moves to Add", async () => {
    await page.getByRole("button", { name: "Add", exact: true }).focus();
  });
  await test.step("Then: the menu closes without stealing focus", async () => {
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add", exact: true })).toBeFocused();
  });
});

for (const item of ["Download", "Edit", "Delete"] as const) {
  test(`PLAYWRIGHT-DECK-LIST-24 Actions survive transient blur: ${item}`, async ({ page }) => {
    await test.step("Given: the second deck's open menu", async () => {
      await launch(page);
      await page.getByRole("button", { name: `Open actions for ${otherName}` }).click();
      await expect(page.getByRole("menuitem", { name: "View", exact: true })).toBeFocused();
    });
    await test.step("When: focus briefly leaves the item then enters another item", async () => {
      await page.getByRole("menuitem", { name: item, exact: true }).evaluate((element) => {
        (document.activeElement as HTMLElement).blur();
        (element as HTMLElement).focus();
      });
      await page.keyboard.press("Enter");
    });
    await test.step("Then: the chosen operation executes for the selected deck", async () => {
      if (item === "Download")
        expect((await inspect(page)) as unknown).toMatchObject({
          downloads: [{ fileName: `${otherName}.csv`, content: expect.stringContaining("Other prompt") }],
        });
      else if (item === "Edit")
        await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(otherName);
      else await expect(page.getByRole("alertdialog")).toContainText(otherName);
    });
  });
}

test("PLAYWRIGHT-DECK-LIST-07 Download uses the selected deck and closes its menu", async ({ page }) => {
  await test.step("Given: a populated deck list", async () => {
    await launch(page);
  });
  await test.step("When: Download is selected", async () => {
    await page.getByRole("button", { name: `Open actions for ${deckName}` }).click();
    await expect(page.getByRole("menu", { name: `Actions for ${deckName}` })).toBeVisible();
    await page.getByRole("menuitem", { name: "Download", exact: true }).click();
  });
  await test.step("Then: one download contains the target card and filename", async () => {
    expect((await inspect(page)) as unknown).toMatchObject({
      downloads: [
        { content: expect.stringContaining("Hello"), fileName: `${deckName}.csv`, mimeType: expect.any(String) },
      ],
    });
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-DECK-LIST-20 Local deck displays no remote synchronization marker", async ({ page }) => {
  const variant = await test.step("Given: a local deck", async () => "local");
  await test.step("When: the list is displayed", async () => {
    await launch(page, variant);
  });
  await test.step("Then: study remains available without remote indicators", async () => {
    const row = page.getByRole("article", { name: deckName });
    await expect(row.getByText("Remote deck", { exact: true })).toHaveCount(0);
    await expect(row.getByLabel("Remote deck")).toHaveCount(0);
    await expect(row.getByTitle("Remote deck")).toHaveCount(0);
    await expect(row.getByRole("button", { name: `Study ${deckName}`, exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-DECK-LIST-21 PLAYWRIGHT-DECK-LIST-26 Pending deletion disables only its target and does not reopen its menu", async ({
  page,
}) => {
  await test.step("Given: deletion is held until a controlled failure", async () => {
    await launch(page, "pending-list-delete");
  });
  const trigger = page.getByRole("button", { name: `Open actions for ${deckName}` });
  await test.step("When: deletion is confirmed", async () => {
    await trigger.click();
    await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete deck", exact: true }).click();
  });
  await test.step("Then: only the target row is busy and every target control is disabled", async () => {
    for (const [name, pending] of [
      [deckName, true],
      [otherName, false],
    ] as const) {
      const row = page.getByRole("article", { name });
      await expect(row).toHaveAttribute("aria-busy", String(pending));
      for (const button of await row.getByRole("button").all()) {
        if (pending) await expect(button).toBeDisabled();
        else await expect(button).toBeEnabled();
      }
    }
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
  await test.step("When: the pending operation fails", async () => {
    await callScenario(page, "decks", "finish");
  });
  await test.step("Then: controls recover and the menu stays closed until opened again", async () => {
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(trigger).toBeEnabled();
    await expect(page.getByRole("button", { name: `Study ${deckName}`, exact: true })).toBeEnabled();
    await expect(page.getByRole("menu")).toHaveCount(0);
    await trigger.click();
    await expect(page.getByRole("menu", { name: `Actions for ${deckName}` })).toBeVisible();
  });
});

test("PLAYWRIGHT-APP-LAYOUT-01 PLAYWRIGHT-APP-LAYOUT-02 Fixed header stays above scrollable deck content", async ({
  page,
}) => {
  await test.step("Given: a narrow viewport and forty decks", async () => {
    await page.setViewportSize({ width: 375, height: 812 });
  });
  await test.step("When: initial content is displayed", async () => {
    await launch(page, "layout");
  });
  const header = page.locator("header");
  const first = page.getByRole("article", { name: "Deck 01", exact: true });
  const before = await header.boundingBox();
  await test.step("Then: the first card starts below the header", async () => {
    const box = await first.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(before!.y + before!.height);
  });
  await test.step("When: the content is scrolled down", async () => {
    await first.evaluate((element) => {
      const scrolling = element.closest(".overflow-y-auto") as HTMLElement;
      if (scrolling.scrollHeight <= scrolling.clientHeight) throw new Error("The page must scroll");
      scrolling.scrollTop = 100;
      scrolling.dispatchEvent(new Event("scroll"));
    });
  });
  await test.step("Then: the header is fixed and the first deck action remains below it", async () => {
    await expect.poll(() => first.evaluate((element) => element.closest(".overflow-y-auto")!.scrollTop)).toBe(100);
    const after = await header.boundingBox();
    expect(after!.y).toBe(before!.y);
    const button = await page.getByRole("button", { name: "Open cards in Deck 01", exact: true }).boundingBox();
    expect(button!.y).toBeGreaterThanOrEqual(after!.y + after!.height);
  });
});

test("PLAYWRIGHT-DECK-FORM-01 PLAYWRIGHT-DECK-FORM-02 Create form accepts fields and omits unused settings", async ({
  page,
}) => {
  await test.step("Given: an empty deck creation form", async () => {
    await launch(page, "create");
  });
  await test.step("When: name and display format are entered", async () => {
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("New deck");
    await page.getByRole("combobox", { name: "Display format" }).selectOption("math");
  });
  await test.step("Then: entered values remain and unused settings are absent", async () => {
    await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("New deck");
    await expect(page.getByRole("combobox", { name: "Display format" })).toHaveValue("math");
    await expect(page.getByRole("checkbox", { name: "Convert line breaks", includeHidden: true })).toHaveCount(0);
    await expect(page.getByText("More settings", { exact: true })).toHaveCount(0);
    await expect(
      page.getByText("Combine two consecutive line breaks into one displayed line break.", { exact: true })
    ).toHaveCount(0);
  });
});

for (const [mode, saveId, failureId, requiredId, languageId] of [
  [
    "create",
    "PLAYWRIGHT-DECK-CREATE-01",
    "PLAYWRIGHT-DECK-CREATE-02",
    "PLAYWRIGHT-DECK-CREATE-03",
    "PLAYWRIGHT-DECK-CREATE-04",
  ],
  ["edit", "PLAYWRIGHT-DECK-EDIT-02", "PLAYWRIGHT-DECK-EDIT-03", "PLAYWRIGHT-DECK-EDIT-04", "PLAYWRIGHT-DECK-EDIT-05"],
] as const) {
  const submit = mode === "create" ? "Create deck" : "Save changes";
  test(`${saveId} Save updates the real routed deck list`, async ({ page }) => {
    await test.step("Given: a valid deck form and successful external save", async () => {
      await launch(page, mode);
    });
    await test.step("When: valid values are saved", async () => {
      await page
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(mode === "create" ? "New deck" : "Renamed deck");
      await page.getByRole("combobox", { name: "Display format" }).selectOption("math");
      await page.getByRole("button", { name: submit, exact: true }).click();
    });
    await test.step("Then: the saved deck is usable alongside the untouched other deck", async () => {
      if (mode === "create") {
        await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "tango", exact: true }).click();
      }
      await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
      await expect(
        page.getByRole("button", { name: `Study ${mode === "create" ? "New deck" : "Renamed deck"}`, exact: true })
      ).toBeVisible();
      await expect(page.getByRole("button", { name: `Study ${otherName}`, exact: true })).toBeVisible();
      if (mode === "edit")
        await expect(page.getByRole("button", { name: `Study ${deckName}`, exact: true })).toHaveCount(0);
    });
  });

  test(`${failureId} Failed save retains values for retry`, async ({ page }) => {
    await test.step("Given: external saving will reject", async () => {
      await launch(page, `${mode}-failure`);
    });
    await test.step("When: a valid draft is submitted", async () => {
      await page
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(mode === "create" ? "New deck" : "Renamed deck");
      await page.getByRole("combobox", { name: "Display format" }).selectOption("math");
      await page.getByRole("button", { name: submit, exact: true }).click();
    });
    await test.step("Then: a safe failure and editable values are retained", async () => {
      await expect(page.getByRole("alert")).toContainText(
        mode === "create" ? "Unable to create" : "Unable to save changes. Try again."
      );
      await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(
        mode === "create" ? "New deck" : "Renamed deck"
      );
      await expect(page.getByRole("combobox", { name: "Display format" })).toHaveValue("math");
      await expect(page.getByRole("button", { name: submit, exact: true })).toBeEnabled();
    });
  });

  for (const japanese of [false, true]) {
    for (const value of ["", "   "]) {
      test(`${requiredId} Required name: language=${japanese ? "ja" : "en"}, input=${JSON.stringify(value)}`, async ({
        page,
      }) => {
        await test.step("Given: the localized form has an invalid name and valid display format", async () => {
          await launch(page, mode, { language: japanese ? "ja" : "en" });
          await page.getByRole("textbox", { name: japanese ? "デッキ名" : "Name", exact: true }).fill(value);
          await page.getByRole("combobox", { name: japanese ? "表示形式" : "Display format" }).selectOption("math");
        });
        await test.step("When: saving is requested", async () => {
          await page
            .getByRole("button", {
              name: japanese ? (mode === "create" ? "デッキを作成" : "変更を保存") : submit,
              exact: true,
            })
            .click();
        });
        await test.step("Then: the name error is accessible and saving has not started", async () => {
          const message = japanese ? "デッキ名は必須です。" : "Deck name is required.";
          const name = page.getByRole("textbox", { name: japanese ? "デッキ名" : "Name", exact: true });
          await expect(page.getByText(message, { exact: true })).toBeVisible();
          await expect(name).toHaveAttribute("aria-invalid", "true");
          await expect(name).toHaveAccessibleDescription(message);
          await expect(name).toHaveValue(value);
          await expect(page.getByRole("combobox")).toHaveValue("math");
          expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
        });
      });
    }
  }

  test(`${languageId} System language changes retain the draft, error relation and focus`, async ({ page }) => {
    await test.step("Given: the System language form has a visible required-name error", async () => {
      await launch(page, mode, { language: "system" });
      await page.getByRole("textbox", { name: "Name", exact: true }).fill("   ");
      await page.getByRole("combobox").selectOption("math");
      await page.getByRole("button", { name: submit, exact: true }).click();
      await expect(page.getByText("Deck name is required.", { exact: true })).toBeVisible();
    });
    const name = page.locator("input[name='name']");
    const descriptionId = await name.getAttribute("aria-describedby");
    await name.focus();
    await name.evaluate((element) => element.setAttribute("data-original-input", "true"));
    for (const [language, label, message] of [
      ["ja-JP", "デッキ名", "デッキ名は必須です。"],
      ["en-US", "Name", "Deck name is required."],
    ] as const) {
      await test.step("When: the browser language changes without resubmitting", async () => {
        await callScenario(page, "decks", "setBrowserLanguage", language);
      });
      await test.step("Then: the same focused input retains its value and translated error", async () => {
        await expect(page.getByText(message, { exact: true })).toBeVisible();
        await expect(page.getByRole("textbox", { name: label, exact: true })).toHaveAttribute(
          "data-original-input",
          "true"
        );
        await expect(name).toHaveValue("   ");
        await expect(name).toBeFocused();
        await expect(name).toHaveAttribute("aria-describedby", descriptionId!);
        await expect(name).toHaveAccessibleDescription(message);
        await expect(page.getByRole("combobox")).toHaveValue("math");
        expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
      });
    }
  });
}

test("PLAYWRIGHT-DECK-EDIT-01 Saved inputs belong only to the selected deck", async ({ page }) => {
  const variant = await test.step("Given: distinct saved deck values", async () => "edit");
  await test.step("When: the selected deck editor is displayed", async () => {
    await launch(page, variant);
  });
  await test.step("Then: its name and format are shown without the other name", async () => {
    await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(deckName);
    await expect(page.getByRole("combobox", { name: "Display format" })).toHaveValue("math");
    await expect(page.locator(`input[value="${otherName}"]`)).toHaveCount(0);
  });
});

test("PLAYWRIGHT-DECK-FORM-04 Confirm deletion of 24 cards and retain the other deck", async ({ page }) => {
  await test.step("Given: the selected deck has twenty-four cards", async () => {
    await launch(page, "edit-delete");
  });
  await test.step("When: deletion is requested", async () => {
    await page.getByRole("button", { name: "Delete deck", exact: true }).click();
  });
  await test.step("Then: the dialog identifies the target and the number of cards", async () => {
    await expect(
      page.getByRole("alertdialog", { name: "Delete deck?" }).getByText(deckName, { exact: true })
    ).toBeVisible();
    await expect(page.getByText("This permanently deletes 24 cards in this deck.", { exact: true })).toBeVisible();
  });
  await test.step("When: deletion is confirmed", async () => {
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete deck", exact: true }).click();
  });
  await test.step("Then: the dialog closes and only the other deck remains", async () => {
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: `Study ${deckName}`, exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: `Study ${otherName}`, exact: true })).toBeVisible();
    expect((await inspect(page)) as unknown).toMatchObject({ deletedDecks: ["contract-deck"] });
  });
});

for (const escape of [false, true]) {
  test(`PLAYWRIGHT-DECK-FORM-05 Cancel deletion with ${escape ? "Escape" : "Cancel"}`, async ({ page }) => {
    await test.step("Given: deletion confirmation is open", async () => {
      await launch(page, "edit");
      await page.getByRole("button", { name: "Delete deck", exact: true }).click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
    });
    await test.step("When: deletion is cancelled", async () => {
      if (escape) await page.keyboard.press("Escape");
      else await page.getByRole("alertdialog").getByRole("button", { name: "Cancel", exact: true }).click();
    });
    await test.step("Then: the unchanged editor remains without a deletion notification", async () => {
      await expect(page.getByRole("alertdialog")).toHaveCount(0);
      await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(deckName);
      await expect(page.getByText(/Deleted deck/)).toHaveCount(0);
      expect((await inspect(page)) as unknown).toMatchObject({ deletedDecks: [] });
    });
  });
}

test("PLAYWRIGHT-DECK-FORM-06 Pending deletion locks confirmation, cancellation and Escape", async ({ page }) => {
  await test.step("Given: deletion I/O is held pending", async () => {
    await launch(page, "pending-edit-delete");
  });
  await test.step("When: deletion is confirmed", async () => {
    await page.getByRole("button", { name: "Delete deck", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete deck", exact: true }).click();
  });
  await test.step("Then: both actions are locked and Escape cannot dismiss", async () => {
    await expect(
      page.getByRole("alertdialog").getByRole("button", { name: "Delete deck", exact: true })
    ).toBeDisabled();
    await expect(page.getByRole("alertdialog").getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeVisible();
  });
  await test.step("When: I/O finishes", async () => {
    await callScenario(page, "decks", "finish");
  });
  await test.step("Then: the editor finishes deletion normally", async () => {
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-IMPORT-01 PLAYWRIGHT-IMPORT-06 Initial import and on-demand CSV guidance", async ({ page }) => {
  const variant = await test.step("Given: no file is selected", async () => "import");
  const guidance = page.getByText(
    "Four columns without a header: front text, back text, tags (optional), and uniqueKey.",
    { exact: true }
  );
  await test.step("When: the initial import screen is displayed", async () => {
    await launch(page, variant);
  });
  await test.step("Then: upload is available without destination or preview", async () => {
    await expect(page.getByRole("heading", { name: "Add a deck", exact: true })).toBeVisible();
    await expect(page.getByLabel("Upload a csv file")).toBeEnabled();
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Review import" })).toHaveCount(0);
    await expect(guidance).toBeHidden();
  });
  await test.step("When: CSV format is expanded", async () => {
    await page.getByText("CSV format", { exact: true }).click();
  });
  await test.step("Then: guidance appears without starting a preview", async () => {
    await expect(guidance).toBeVisible();
    await expect(page.getByLabel("Upload a csv file")).toBeEnabled();
    await expect(page.getByRole("heading", { name: "Review import" })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-IMPORT-02 File selection parses the four-column CSV into a preview", async ({ page }) => {
  await test.step("Given: a CSV file and no preview or destination radio", async () => {
    await launch(page, "import");
    await expect(page.getByRole("heading", { name: "Review import" })).toHaveCount(0);
    await expect(page.getByRole("radio")).toHaveCount(0);
  });
  await test.step("When: the file is selected", async () => {
    await page
      .getByLabel("Upload a csv file")
      .setInputFiles(csvFile('"storybook prompt","storybook answer","story","storybook-import"'));
  });
  await test.step("Then: real parsing exposes the answer and valid row count", async () => {
    await expect(page.getByRole("heading", { name: "Review import", exact: true })).toBeVisible();
    await expect(page.getByText("1 valid", { exact: true })).toBeVisible();
    await expect(page.getByText("storybook answer", { exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-IMPORT-10 Preview, choose again and confirmed import are separate operations", async ({ page }) => {
  await test.step("Given: a valid CSV with one trailing blank row", async () => {
    await launch(page, "import");
  });
  await test.step("When: the CSV is selected", async () => {
    await page.getByLabel("Upload a csv file").setInputFiles(csvFile());
  });
  await test.step("Then: both sides, key and skipped count appear before any save", async () => {
    const preview = page.getByRole("region", { name: "Review import" });
    for (const text of ["front", "back", "uniqueKey: key-1", "1 blank row skipped"])
      await expect(preview.getByText(text, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add a deck", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try this example" })).toHaveCount(0);
    expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
  });
  await test.step("When: choosing a different source", async () => {
    await page.getByRole("button", { name: "Choose file or example" }).click();
  });
  await test.step("Then: preview clears without importing or announcing success", async () => {
    await expect(page.getByRole("heading", { name: "Review import" })).toHaveCount(0);
    await expect(page.getByRole("status", { name: "Toast notifications" })).toBeEmpty();
    expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
  });
  await test.step("When: the CSV is reselected and explicitly added", async () => {
    await page.getByLabel("Upload a csv file").setInputFiles(csvFile());
    await page.getByRole("button", { name: "Add 1 card", exact: true }).click();
  });
  await test.step("Then: imported deck and completion notification appear", async () => {
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Study deck.csv", exact: true })).toBeVisible();
    await expect(page.getByRole("status", { name: "Toast notifications" })).toContainText("Imported 1 card");
  });
});

test("PLAYWRIGHT-IMPORT-09 A replacement file does not mix with the old preview", async ({ page }) => {
  await test.step("Given: the first file's preview", async () => {
    await launch(page, "import");
    await page.getByLabel("Upload a csv file").setInputFiles(csvFile());
    await expect(page.getByRole("region", { name: "Review import" })).toContainText("uniqueKey: key-1");
  });
  await test.step("When: a differently named CSV is selected", async () => {
    await page.getByLabel("Upload a csv file").setInputFiles(csvFile("different,answer,,key-2", "different.csv"));
  });
  await test.step("Then: only replacement values are shown", async () => {
    const preview = page.getByRole("region", { name: "Review import" });
    await expect(preview).toContainText("uniqueKey: key-2");
    await expect(preview).toContainText("different.csv");
    await expect(preview).not.toContainText("uniqueKey: key-1");
    await expect(preview.getByText("answer", { exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-IMPORT-11 A missing key blocks the entire partly valid CSV", async ({ page }) => {
  await test.step("Given: one valid row, a blank row and an invalid third row", async () => {
    await launch(page, "import");
  });
  await test.step("When: the CSV is selected", async () => {
    await page.getByLabel("Upload a csv file").setInputFiles(csvFile("front,back,,key-1\n\ninvalid,answer,,"));
  });
  await test.step("Then: row-specific diagnostic and valid count are shown with Add disabled", async () => {
    await expect(page.getByRole("alert")).toContainText("Row 3: Unique key is required.");
    await expect(page.getByRole("alert")).toContainText("Choose a corrected CSV file to continue.");
    await expect(page.getByText("1 valid", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add 1 card", exact: true })).toBeDisabled();
  });
});

test("PLAYWRIGHT-IMPORT-03 Invalid CSV diagnostics are Japanese and cannot be confirmed", async ({ page }) => {
  await test.step("Given: Japanese import and a three-column CSV", async () => {
    await launch(page, "import", { language: "ja" });
  });
  await test.step("When: the invalid file is selected", async () => {
    await page.getByLabel("CSVファイルをアップロード").setInputFiles(csvFile("front,back,key"));
  });
  await test.step("Then: diagnostics, valid count and document language are Japanese", async () => {
    await expect(page.getByRole("alert")).toContainText("列数は4列である必要があります（現在は3列）。");
    await expect(page.getByText("有効: 0件", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "0枚のカードを追加", exact: true })).toBeDisabled();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  });
});

test("PLAYWRIGHT-IMPORT-07 An import from an earlier visit keeps selection locked", async ({ page }) => {
  const variant = await test.step("Given: a previously accepted import is pending", async () =>
    "import-pending-selection");
  await test.step("When: the import page is displayed again", async () => {
    await launch(page, variant);
  });
  await test.step("Then: file and example selection stay disabled without a destination group", async () => {
    await expect(page.getByText("Importing…", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Upload a csv file")).toBeDisabled();
    await expect(page.getByRole("button", { name: "Try this example", exact: true })).toBeDisabled();
    await expect(page.getByRole("group", { name: "Save to" })).toHaveCount(0);
    await expect(page.getByRole("radio")).toHaveCount(0);
  });
});

for (const [name, key, fileName] of [
  ["Basic", "apple-001", "basic-sample.csv"],
  ["Math", "circle-area", "math-sample.csv"],
  ["Markdown", "markdown-source", "markdown-sample.csv"],
  ["Sample deck", "test/binarysearch/test_bisect_left.py", "deck-sample.csv"],
] as const) {
  test(`PLAYWRIGHT-IMPORT-08 Example selection, keyboard download and real CSV parsing: ${name}`, async ({ page }) => {
    await test.step("Given: available import examples", async () => {
      await launch(page, "import");
    });
    await test.step("When: the example is selected and Download CSV is reached by Tab", async () => {
      await page.getByRole("button", { name, exact: true }).click();
      await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "true");
      await page.getByRole("button", { name: "Try this example", exact: true }).focus();
      await page.keyboard.press("Tab");
    });
    await test.step("Then: keyboard activation requests the selected example's CSV", async () => {
      await expect(page.getByRole("button", { name: "Download CSV", exact: true })).toBeFocused();
      await expect(page.getByRole("button", { name: "Download CSV", exact: true })).toBeEnabled();
      await page.keyboard.press("Enter");
      expect((await inspect(page)) as unknown).toMatchObject({
        downloads: [{ fileName, content: expect.stringContaining(key) }],
        deckWrites: [],
      });
    });
    await test.step("When: Try this example is selected", async () => {
      await page.getByRole("button", { name: "Try this example", exact: true }).click();
    });
    await test.step("Then: its parsed content and enabled Add are shown without saving", async () => {
      const preview = page.getByRole("region", { name: "Review import" });
      await expect(preview).toContainText(key);
      await expect(preview.getByRole("button", { name: /Add .* cards/ })).toBeEnabled();
      expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
    });
  });
}

for (const [kind, english, japanese] of [
  ["authentication", "A confirmed user is required", "アカウントへのインポートには認証済みユーザーが必要です。"],
  ["account-changed", "The account has changed", "アカウントが変わりました。CSVファイルや例をもう一度選んでください。"],
  ["permission", "You do not have permission", "このデータをインポートする権限がありません。"],
  ["network", "Unable to connect", "接続できませんでした。接続を確認して再試行してください。"],
  [
    "storage",
    "Free some storage space",
    "データを保存できませんでした。ストレージの空き容量を確保して再試行してください。",
  ],
  ["unknown", "The import preview could not be prepared", "インポートのプレビューを準備できませんでした。"],
] as const) {
  test(`PLAYWRIGHT-IMPORT-04 Safe file preparation failure is translated: ${kind}`, async ({ page }) => {
    await test.step("Given: the external file read fails with the specified cause", async () => {
      await launch(page, "import-read-failure", { failure: kind });
    });
    await test.step("When: the file is selected", async () => {
      await page.getByLabel("Upload a csv file").setInputFiles(csvFile());
    });
    await test.step("Then: safe English text is displayed", async () => {
      await expect(page.getByRole("alert")).toContainText(english);
    });
    await test.step("When: language changes to Japanese", async () => {
      await callScenario(page, "decks", "setLanguage", "ja");
    });
    await test.step("Then: cause-specific Japanese text hides internal diagnostics and allows selection", async () => {
      await expect(page.getByRole("alert")).toContainText(japanese);
      await expect(page.getByRole("alert")).not.toContainText("private diagnostic");
      await expect(page.getByLabel("CSVファイルをアップロード")).toBeEnabled();
    });
  });
}

test("PLAYWRIGHT-IMPORT-12 A file read failure recovers through a new selection", async ({ page }) => {
  await test.step("Given: the next file read will fail", async () => {
    await launch(page, "import-read-once");
  });
  await test.step("When: the unreadable file is selected", async () => {
    await page.getByLabel("Upload a csv file").setInputFiles(csvFile());
  });
  await test.step("Then: a safe error keeps all selection operations available", async () => {
    await expect(page.getByRole("alert")).toContainText("The import preview could not be prepared.");
    await expect(page.getByRole("alert")).not.toContainText("file read failed");
    await expect(page.getByLabel("Upload a csv file")).toBeEnabled();
    await expect(page.getByRole("button", { name: "Try this example", exact: true })).toBeEnabled();
  });
  await test.step("When: a readable file is selected", async () => {
    await page.getByLabel("Upload a csv file").setInputFiles(csvFile());
  });
  await test.step("Then: the new content is previewed", async () => {
    await expect(page.getByRole("region", { name: "Review import" })).toContainText("uniqueKey: key-1");
  });
});

for (const [kind, text, english, japanese, userText] of [
  [
    "duplicate",
    "ユーザー入力,answer,,自作キー\nother,answer,,自作キー",
    'uniqueKey "自作キー" is duplicated',
    "一意キー「自作キー」がファイル内で重複しています。",
    "自作キー",
  ],
  [
    "columns",
    "ユーザー入力,answer",
    "Expected 4 columns",
    "列数は4列である必要があります（現在は2列）。",
    "ユーザー入力",
  ],
  ["empty", "", "The CSV file is empty", "CSVファイルが空です。", ""],
  [
    "quotes",
    '"ユーザー入力"bad,answer,,key',
    "Trailing quote on quoted field is malformed",
    "フィールドの閉じ引用符の形式が正しくありません。",
    "ユーザー入力",
  ],
  [
    "unknown",
    "",
    "The CSV could not be parsed.",
    "CSVを解析できませんでした。形式を確認してください。",
    "ユーザー入力",
  ],
] as const) {
  test(`PLAYWRIGHT-IMPORT-05 Parsed diagnostic translation preserves user content: ${kind}`, async ({ page }) => {
    await test.step("Given: an invalid file or an unknown parser diagnostic", async () => {
      await launch(page, kind === "unknown" ? "import-unknown-diagnostic" : "import");
    });
    await test.step("When: the file is parsed", async () => {
      if (kind !== "unknown") await page.getByLabel("Upload a csv file").setInputFiles(csvFile(text));
    });
    await test.step("Then: its safe English diagnostic is shown", async () => {
      await expect(page.getByRole("alert")).toContainText(english);
    });
    await test.step("When: language changes to Japanese", async () => {
      await callScenario(page, "decks", "setLanguage", "ja");
    });
    await test.step("Then: translated diagnostics retain original user strings", async () => {
      await expect(page.getByRole("alert")).toContainText(japanese);
      if (userText) await expect(page.getByRole("alert")).toContainText(userText);
      await expect(page.getByRole("alert")).not.toContainText("private diagnostic");
    });
  });
}

test("PLAYWRIGHT-IMPORT-10 Explicit confirmation holds selection until import completes", async ({ page }) => {
  await test.step("Given: creation I/O remains pending until released", async () => {
    await launch(page, "import-pending-confirmation");
  });
  await test.step("When: a CSV is selected", async () => {
    await page.getByLabel("Upload a csv file").setInputFiles(csvFile());
  });
  await test.step("Then: preview preparation alone does not save", async () => {
    await expect(page.getByRole("region", { name: "Review import" })).toBeVisible();
    expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
  });
  await test.step("When: Add is explicitly selected", async () => {
    await page.getByRole("button", { name: "Add 1 card", exact: true }).click();
  });
  await test.step("Then: import is pending and file selection is disabled", async () => {
    await expect(page.getByText("Importing…", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Upload a csv file")).toBeDisabled();
  });
  await test.step("When: creation I/O finishes", async () => {
    await callScenario(page, "decks", "finish");
  });
  await test.step("Then: the real route returns to the deck list", async () => {
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-DECK-IMPORT-14 Cached CSV diagnostics follow System language without rereading", async ({ page }) => {
  let context: string[];
  await test.step("Given: a CSV preview with cached English diagnostics and user context", async () => {
    await launch(page, "import", { language: "system" });
    await page
      .getByLabel("Upload a csv file")
      .setInputFiles(csvFile('問題,回答,個人タグ,key-1\n,,,key-2\n"unterminated', "日本語.csv"));
    await expect(page.getByRole("alert")).toContainText("Front text is required.");
    context = await page.getByRole("alert").locator("code").allTextContents();
  });
  await test.step("When: the browser language changes and accidental file rereads are rejected", async () => {
    await page.evaluate(() => {
      File.prototype.text = () => Promise.reject(new Error("Unexpected file reread"));
      File.prototype.arrayBuffer = () => Promise.reject(new Error("Unexpected file reread"));
    });
    await callScenario(page, "decks", "setBrowserLanguage", "ja-JP");
  });
  await test.step("Then: diagnostics translate with the same preview, order and original user input", async () => {
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    const alert = page.getByRole("alert");
    await expect(alert).toContainText("表面のテキストは必須です。");
    await expect(alert).toContainText("裏面のテキストは必須です。");
    await expect(alert).toContainText("引用符で囲まれたフィールドが閉じられていません。");
    await expect(alert.getByRole("listitem")).toHaveCount(3);
    await expect(alert.locator("code")).toHaveText(context);
    await expect(page.getByText("有効: 1件", { exact: true })).toBeVisible();
    await expect(page.getByText("無効: 2件", { exact: true })).toBeVisible();
    await expect(page.getByText("問題", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "1枚のカードを追加", exact: true })).toBeDisabled();
    await expect(page).toHaveURL(/\/import$/);
  });
});

test("PLAYWRIGHT-DECK-LIST-27 Reserved identifiers remain distinct across navigation and reload", async ({ page }) => {
  await test.step("Given: plain and reserved-character deck identifiers", async () => {
    await launch(page, "reserved-identifiers");
  });
  const before = await inspect(page);
  for (const [id, name, prompt, other] of [
    ["deck-special", "Plain identifier", "Plain prompt", "Reserved prompt"],
    ["deck-special?#suffix", "Reserved identifier", "Reserved prompt", "Plain prompt"],
  ] as const) {
    await test.step("When: the selected deck's name is activated", async () => {
      if (new URL(page.url()).pathname !== "/") await page.getByRole("button", { name: "tango", exact: true }).click();
      await page.getByRole("button", { name: `Open cards in ${name}`, exact: true }).click();
    });
    await test.step("Then: the identifier is encoded without query or fragment", async () => {
      const url = new URL(page.url());
      expect(url.pathname).toBe(`/deck/${encodeURIComponent(id)}`);
      expect(url.search).toBe("");
      expect(url.hash).toBe("");
    });
    for (const entry of ["navigation", "direct", "reload"]) {
      await test.step("When: entering the same route through the selected entry method", async () => {
        if (entry === "direct") await page.goto(`/deck/${encodeURIComponent(id)}`);
        if (entry === "reload") await page.reload();
      });
      await test.step("Then: only the selected deck's cards are displayed without writes", async () => {
        await expect(page.getByRole("button", { name: `View ${prompt}`, exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: `View ${other}`, exact: true })).toHaveCount(0);
        await expect(page.getByText("Hello", { exact: true })).toHaveCount(0);
        expect(await inspect(page)).toEqual(before);
      });
    }
  }
});

test("PLAYWRIGHT-DECK-LIST-29 Review deadlines update counts without writes", async ({ page }) => {
  await test.step("Given: one due card, one new card and a deadline one second away", async () => {
    await page.clock.install({ time: Date.UTC(2026, 6, 1, 12) });
    await page.clock.pauseAt(Date.UTC(2026, 6, 1, 12));
    await launch(page, "deadline");
  });
  const before = await inspect(page);
  await test.step("When: focus refreshes counts before the deadline", async () => {
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  });
  await test.step("Then: the future card is not due", async () => {
    await expect(page.getByText("1 due · 1 new", { exact: true })).toHaveCount(2);
  });
  await test.step("When: the deadline arrives", async () => {
    await page.clock.runFor(1000);
  });
  await test.step("Then: counts update with no card or session changes", async () => {
    await expect(page.getByText("2 due · 1 new", { exact: true })).toHaveCount(2);
    expect(await inspect(page)).toEqual(before);
  });
});

for (const [rejected, caseId] of [
  [false, "PLAYWRIGHT-DECK-LIST-38"],
  [true, "PLAYWRIGHT-DECK-LIST-39"],
] as const) {
  test(`${caseId} Continue accepts only the first activation: rejection=${rejected}`, async ({ page }) => {
    await test.step("Given: two resumable decks and a delayed external touch operation", async () => {
      await launch(page, rejected ? "continue-failure" : "continue-success", { account: "linked" });
    });
    const first = page.getByRole("button", { name: `Continue ${deckName}`, exact: true });
    const other = page.getByRole("button", { name: `Continue ${otherName}`, exact: true });
    await test.step("When: Continue is activated and both buttons receive repeated activation", async () => {
      if (rejected) await first.click();
      else await first.press("Enter");
      await expect(first).toBeDisabled();
      await first.dispatchEvent("click");
      await other.dispatchEvent("click");
    });
    await test.step("Then: only the selected deck has pending feedback and all Continue buttons are locked", async () => {
      await expect(first).toBeDisabled();
      await expect(first).toHaveAttribute("aria-busy", "true");
      await expect(first).toHaveAccessibleDescription("Resuming study…");
      await expect(other).toBeDisabled();
      await expect(page.getByRole("button", { name: `Open cards in ${deckName}`, exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: `Open cards in ${otherName}`, exact: true })).toBeEnabled();
      await expect(page.getByRole("button", { name: "Add", exact: true })).toBeEnabled();
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page).toHaveURL(/\/$/);
      expect((await inspect(page)) as unknown).toMatchObject({ touchedDecks: ["contract-deck"] });
    });
    await test.step("When: the original operation settles", async () => {
      await callScenario(page, "decks", "finish");
    });
    if (rejected) {
      await test.step("Then: failure restores explicit retry without queued navigation", async () => {
        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByRole("alert")).toHaveCount(1);
        await expect(first).toBeEnabled();
        await expect(other).toBeEnabled();
        await expect(page.getByText("Resuming study…", { exact: true })).toHaveCount(0);
        expect((await inspect(page)) as unknown).toMatchObject({ touchedDecks: ["contract-deck"], studyRequests: [] });
      });
      await test.step("When: the other deck is explicitly retried", async () => {
        await other.click();
      });
    }
    await test.step("Then: only the accepted deck resumes at its saved card", async () => {
      await expect(page).toHaveURL(new RegExp(`/deck/${rejected ? "other-deck" : "contract-deck"}/study$`));
      await expect(
        page.getByRole("button", { name: rejected ? "Other second prompt" : "Hello", exact: true })
      ).toBeVisible();
      await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue(rejected ? "1" : "0");
      expect((await inspect(page)) as unknown).toMatchObject({
        touchedDecks: rejected ? ["contract-deck", "other-deck", "other-deck"] : ["contract-deck", "contract-deck"],
        studyRequests: [],
        deckWrites: [],
      });
    });
  });
}

for (const height of [360, 640]) {
  test(`PLAYWRIGHT-DECK-LIST-40 Long deletion content and cancellation remain reachable at height ${height}`, async ({
    page,
  }) => {
    const name = `START ${"Long deletion target name ".repeat(12)}END`;
    await test.step("Given: a long-name deck with a saved active session", async () => {
      await page.setViewportSize({ width: 360, height });
      await launch(page, "long-delete");
      await page.getByRole("button", { name: `Open actions for ${name}`, exact: true }).click();
      await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
      await expect(page.getByRole("alertdialog").getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
    });
    const before = await inspect(page);
    const dialog = page.getByRole("alertdialog", { name: "Delete deck?" });
    const target = dialog.getByText(name, { exact: true });
    const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
    const confirm = dialog.getByRole("button", { name: "Delete deck", exact: true });
    const fullyVisible = (locator: ReturnType<Page["getByRole"]>) =>
      locator.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth;
      });
    await test.step("When: the dialog's heading and independently scrolling name are read", async () => {
      await page.mouse.move(8, height / 2);
      await page.mouse.wheel(0, -10000);
      const heading = dialog.getByRole("heading", { name: "Delete deck?", exact: true });
      await heading.click({ trial: true });
      expect(await fullyVisible(heading)).toBe(true);
      await target.focus();
      await target.press("Home");
      await expect.poll(() => target.evaluate((element) => element.scrollTop)).toBe(0);
      expect(await fullyVisible(target)).toBe(true);
      await target.press("End");
    });
    await test.step("Then: the name's end and each warning remain reachable", async () => {
      await expect
        .poll(() => target.evaluate((element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1))
        .toBe(true);
      expect(await target.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
      for (const text of [
        "This permanently deletes 5 cards in this deck.",
        "Any in-progress study session for this deck will also end.",
        "This action cannot be undone.",
      ]) {
        const paragraph = dialog.getByText(text, { exact: true });
        await paragraph.scrollIntoViewIfNeeded();
        await paragraph.click({ trial: true });
        expect(await fullyVisible(paragraph)).toBe(true);
      }
    });
    await test.step("When: keyboard navigation reaches both actions and returns to Cancel", async () => {
      await target.focus();
      await page.keyboard.press("Tab");
      await expect(cancel).toBeFocused();
      expect(await fullyVisible(cancel)).toBe(true);
      await page.keyboard.press("Shift+Tab");
      await expect(target).toBeFocused();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect(confirm).toBeFocused();
      expect(await fullyVisible(confirm)).toBe(true);
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Enter");
    });
    await test.step("Then: cancellation restores the trigger without changing any prepared data", async () => {
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole("button", { name: `Open actions for ${name}`, exact: true })).toBeFocused();
      expect(await inspect(page)).toEqual(before);
    });
  });
}

test("PLAYWRIGHT-DECK-LIST-43 Deletion success remains successful when session cleanup fails", async ({ page }) => {
  await test.step("Given: a deck whose external session cleanup rejects", async () => {
    await launch(page, "cleanup-failure");
  });
  await test.step("When: deck deletion is confirmed", async () => {
    await page.getByRole("button", { name: `Open actions for ${deckName}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete deck", exact: true }).click();
  });
  await test.step("Then: the target disappears with only the cleanup-specific warning", async () => {
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByRole("alert")).toContainText(
      "The deck was deleted, but its study session could not be closed."
    );
    await expect(
      page.getByText("Unable to delete this deck. Check your connection and try again.", { exact: true })
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: `Open cards in ${deckName}`, exact: true })).toHaveCount(0);
    await expect(page.getByRole("article", { name: otherName, exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-DECK-EDIT-07 Keep editing preserves a draft and a later discard returns to saved values", async ({
  page,
}) => {
  await test.step("Given: an unsaved deck name", async () => {
    await launch(page, "edit");
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("Unsaved deck");
  });
  await test.step("When: leaving is requested and cancelled", async () => {
    await page.getByRole("button", { name: "tango", exact: true }).click();
    await page
      .getByRole("alertdialog", { name: "Discard unsaved changes?" })
      .getByRole("button", { name: "Keep editing", exact: true })
      .click();
  });
  await test.step("Then: the draft stays in the same editor", async () => {
    await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Unsaved deck");
  });
  await test.step("When: a second leave attempt discards the changes", async () => {
    await page.getByRole("button", { name: "tango", exact: true }).click();
    await page
      .getByRole("alertdialog", { name: "Discard unsaved changes?" })
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
  });
  await test.step("Then: the saved name appears without any save request", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: `Open cards in ${deckName}`, exact: true })).toBeVisible();
    expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
  });
});

test("PLAYWRIGHT-DECK-LIST-44 Export preserves every selected card field in one CSV record", async ({ page }) => {
  await test.step("Given: cards with commas, quotes, newlines, tags and Japanese text", async () => {
    await launch(page, "export-fields");
  });
  const before = (await inspect(page)) as {
    cards: { frontText: string; backText: string; tags: string[]; uniqueKey: string }[];
  };
  await test.step("When: Download is selected", async () => {
    await page.getByRole("button", { name: `Open actions for ${deckName}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Download", exact: true }).click();
  });
  await test.step("Then: the CSV filename and logical records preserve all fields", async () => {
    const result = (await inspect(page)) as { downloads: { fileName: string; content: string }[] };
    expect(result.downloads).toHaveLength(1);
    expect(result.downloads[0]!.fileName).toBe(`${deckName}.csv`);
    const parsed = Papa.parse<string[]>(result.downloads[0]!.content);
    expect(parsed.errors).toEqual([]);
    expect(parsed.data).toEqual(
      before.cards.map((card) => [card.frontText, card.backText, card.tags.join(","), card.uniqueKey])
    );
  });
});

test("PLAYWRIGHT-DECK-IMPORT-01 Upload focus outline and preview use normal keyboard order", async ({ page }) => {
  await test.step("Given: upload is focused on the import page", async () => {
    await launch(page, "import");
  });
  const upload = page.getByLabel("Upload a csv file");
  const area = page.locator("label").filter({ has: upload });
  await upload.focus();
  await test.step("When: keyboard focus moves away, back and away again", async () => {
    await expect(upload).toBeFocused();
    await expect(area).toHaveCSS("outline-style", "solid");
    await expect(area).toHaveCSS("outline-width", "2px");
    await expect(area).toHaveCSS("outline-offset", "3px");
    await expect(area).toHaveCSS("opacity", "1");
    await page.keyboard.press("Tab");
    await expect(page.getByText("CSV format", { exact: true })).toBeFocused();
    await expect(area).toHaveCSS("outline-style", "none");
    await page.keyboard.press("Shift+Tab");
    await expect(upload).toBeFocused();
    await expect(area).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Shift+Tab");
    await expect(area).toHaveCSS("outline-style", "none");
  });
  await test.step("When: a valid two-card CSV is selected", async () => {
    await upload.setInputFiles(
      csvFile(
        '"front preview one","back preview one","tag-preview","preview-key-1"\n"front preview two","back preview two","","preview-key-2"',
        "preview.csv"
      )
    );
  });
  await test.step("Then: name, valid count and both sides appear without any save request", async () => {
    await expect(page.getByRole("heading", { level: 2, name: "Review import" })).toBeVisible();
    await expect(page.getByText("preview.csv", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("2 valid", { exact: true })).toBeVisible();
    await expect(page.getByText("front preview one", { exact: true })).toBeVisible();
    await expect(page.getByText("back preview two", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add 2 cards", exact: true })).toBeEnabled();
    expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
  });
});

for (const [name, row, message] of [
  ["blank key", '"invalid front","invalid back","tag",""', "Unique key is required."],
  ["three columns", '"invalid front","invalid back","key"', "Expected 4 columns, found 3."],
] as const) {
  test(`PLAYWRIGHT-DECK-IMPORT-13 Invalid CSV blocks all writes: ${name}`, async ({ page }) => {
    await test.step("Given: a valid first row and invalid second row", async () => {
      await launch(page, "import");
    });
    await test.step("When: the CSV is selected", async () => {
      await page
        .getByLabel("Upload a csv file")
        .setInputFiles(csvFile(`"valid front","valid back","","valid-key"\n${row}`));
    });
    await test.step("Then: row diagnostics disable Add without saving the valid part", async () => {
      await expect(page.getByRole("alert")).toContainText("Row 2");
      await expect(page.getByRole("alert")).toContainText(message);
      await expect(page.getByText("1 invalid", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Add 1 card", exact: true })).toBeDisabled();
      expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
    });
  });
}

test("PLAYWRIGHT-DECK-IMPORT-08 Same-path invalid UTF-8 can be selected repeatedly and corrected", async ({
  page,
}, testInfo) => {
  const path = testInfo.outputPath("retry.csv");
  await test.step("Given: a file with invalid UTF-8 bytes", async () => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, Buffer.from([0x82, 0xa0, 44, 98, 44, 44, 107]));
    await launch(page, "empty");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("menuitem", { name: "Import decks", exact: true }).click();
  });
  const upload = page.getByLabel("Upload a csv file");
  await test.step("When: an earlier valid two-card CSV is previewed", async () => {
    await upload.setInputFiles(
      csvFile(
        '"front previous one","back previous one","tag-previous","previous-key-1"\n"front previous two","back previous two","","previous-key-2"',
        "previous.csv"
      )
    );
  });
  await test.step("Then: the previous file has two valid cards and an enabled import action", async () => {
    await expect(page.getByText("2 valid", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add 2 cards", exact: true })).toBeEnabled();
  });
  await test.step("When: the previous selection is replaced with invalid UTF-8", async () => {
    await page.getByRole("button", { name: "Choose file or example", exact: true }).click();
    await upload.setInputFiles({
      name: "invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from([0x82, 0xa0, 44, 98, 44, 44, 107]),
    });
  });
  await test.step("Then: encoding errors remove the earlier preview and every Add action", async () => {
    await expect(page.getByRole("alert")).toContainText(
      "This CSV cannot be read as UTF-8. Save it as UTF-8 and select it again."
    );
    await expect(page.getByRole("button", { name: /^Add \d+ cards?$/u })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Review import", exact: true })).toHaveCount(0);
    expect(await inspect(page)).toMatchObject({ decks: [], cards: [], deckWrites: [], cardWrites: [] });
  });
  await test.step("When: the failed preview is left", async () => {
    await page.getByRole("button", { name: "tango", exact: true }).click();
  });
  await test.step("Then: no deck or card was added", async () => {
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
    expect(await inspect(page)).toMatchObject({ decks: [], cards: [], deckWrites: [], cardWrites: [] });
  });
  await test.step("When: import is opened again", async () => {
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("menuitem", { name: "Import decks", exact: true }).click();
  });
  await test.step("Then: preparation still has not started a save", async () => {
    await expect(upload).toBeEnabled();
    expect(await inspect(page)).toMatchObject({ decks: [], cards: [], deckWrites: [], cardWrites: [] });
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    await test.step("When: the same invalid path is selected", async () => {
      await upload.setInputFiles(path);
    });
    await test.step("Then: UTF-8 guidance appears and the native picker resets", async () => {
      await expect(page.getByRole("alert")).toContainText("This CSV cannot be read as UTF-8.");
      await expect(upload).toHaveValue("");
    });
  }
  await test.step("When: the same file is corrected", async () => {
    await writeFile(path, "corrected front,corrected back,,corrected-key");
    await upload.setInputFiles(path);
  });
  await test.step("Then: the corrected preview is available and picker cancellation preserves it", async () => {
    await expect(page.getByText("corrected front", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add 1 card", exact: true })).toBeEnabled();
    await upload.dispatchEvent("cancel");
    await expect(page.getByText("corrected front", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add 1 card", exact: true })).toBeEnabled();
  });
  await test.step("When: the same file is replaced with a missing unique key", async () => {
    await writeFile(path, "invalid front,back,,");
    await upload.setInputFiles(path);
  });
  await test.step("Then: validation blocks the invalid content", async () => {
    await expect(page.getByRole("alert")).toContainText("Unique key is required.");
    await expect(page.getByRole("button", { name: "Add 0 cards", exact: true })).toBeDisabled();
  });
  await test.step("When: the same file is corrected again", async () => {
    await writeFile(path, "latest front,latest back,,latest-key");
    await upload.setInputFiles(path);
  });
  await test.step("Then: latest contents replace stale errors and no save has started", async () => {
    await expect(page.getByText("latest front", { exact: true })).toBeVisible();
    await expect(page.getByText("latest back", { exact: true })).toBeVisible();
    await expect(page.getByText("retry.csv", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add 1 card", exact: true })).toBeEnabled();
    expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
  });
});

for (const example of [
  { label: "Basic", file: "basic-sample.csv", count: 3, row: ["apple", "りんご", "果物", "apple-001"] },
  {
    label: "Math",
    file: "math-sample.csv",
    count: 2,
    row: ["半径 $r$ の円の面積は？", "$\\pi r^2$", "math", "circle-area"],
  },
  {
    label: "Markdown",
    file: "markdown-sample.csv",
    count: 2,
    row: ["Markdownで強調するには？", "**重要**な語句を強調します。", "md", "markdown-source"],
  },
  {
    label: "Sample deck",
    file: "deck-sample.csv",
    count: 11,
    row: [
      "What is bisect_left?",
      expect.stringContaining("def my_bisect_left(sl, a):\n    lo, hi = 0, len(sl)"),
      "py,binarysearch",
      "test/binarysearch/test_bisect_left.py",
    ],
  },
]) {
  for (const account of ["anonymous", "linked"]) {
    test(`PLAYWRIGHT-DECK-IMPORT-03 PLAYWRIGHT-DECK-IMPORT-05 Full example selection and import: ${example.label}, ${account}`, async ({
      page,
    }) => {
      await test.step("Given: the selected account can preview built-in examples", async () => {
        await launch(page, "import", { account });
      });
      await test.step("When: the example's source is opened and downloaded", async () => {
        await page.getByRole("button", { name: example.label, exact: true }).click();
        await page.getByText("View CSV source", { exact: true }).click();
        await page.getByRole("button", { name: "Download CSV", exact: true }).click();
      });
      const result = (await inspect(page)) as { downloads: { fileName: string; content: string }[] };
      const csv = result.downloads[0]!.content;
      const parsed = Papa.parse<string[]>(csv);
      await test.step("Then: download and displayed source preserve each documented field", async () => {
        expect(result.downloads).toHaveLength(1);
        expect(result.downloads[0]!.fileName).toBe(example.file);
        const displayed = await page.locator("details[data-import-sample] code").textContent();
        expect(displayed?.replaceAll("\r\n", "\n")).toBe(csv.replaceAll("\r\n", "\n"));
        expect(parsed.errors).toEqual([]);
        expect(parsed.data).toContainEqual(example.row);
        expect(parsed.data).toHaveLength(example.count);
        expect(parsed.data.every((row) => row.length === 4 && row[3] !== "")).toBe(true);
      });
      await test.step("When: the example is previewed", async () => {
        await page.getByRole("button", { name: "Try this example", exact: true }).click();
      });
      await test.step("Then: all previewed rows retain both sides and keys before saving", async () => {
        await expect(page.getByRole("heading", { name: "Review import", exact: true })).toBeVisible();
        await expect(page.getByText(`${example.count} valid`, { exact: true })).toBeVisible();
        for (const row of parsed.data.slice(0, 3))
          await expect(page.getByText(`uniqueKey: ${row[3]}`, { exact: true })).toBeVisible();
        expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
      });
      await test.step("When: choosing again and reopening the same example", async () => {
        await page.getByRole("button", { name: "Choose file or example", exact: true }).click();
        await expect(page.getByRole("button", { name: "Basic", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Sample deck", exact: true })).toBeVisible();
        await page.getByRole("button", { name: example.label, exact: true }).click();
        await page.getByRole("button", { name: "Try this example", exact: true }).click();
      });
      await test.step("Then: re-previewing retains the key without creating a deck", async () => {
        await expect(page.getByText(`uniqueKey: ${parsed.data[0]![3]}`, { exact: true })).toBeVisible();
        expect((await inspect(page)) as unknown).toMatchObject({ deckWrites: [], cardWrites: [] });
      });
      await test.step("When: Add explicitly confirms the example import", async () => {
        await page.getByRole("button", { name: `Add ${example.count} cards`, exact: true }).click();
      });
      await test.step("Then: the imported deck and every card field are available through the real store and route", async () => {
        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByRole("status", { name: "Toast notifications" })).toContainText(
          `Imported ${example.count} cards.`
        );
        const snapshot = (await inspect(page)) as {
          decks: { name: string; id: string }[];
          cards: { deckId: string; frontText: string; backText: string; tags: string[]; uniqueKey: string }[];
        };
        const imported = snapshot.decks.filter((deck) => deck.name === example.file);
        expect(imported).toHaveLength(1);
        const importedCards = snapshot.cards.filter((card) => card.deckId === imported[0]!.id);
        const byKey = (left: string[], right: string[]) => left[3]!.localeCompare(right[3]!);
        // CSV identity is the unique key; the store's display order is independent of file order.
        expect(
          importedCards
            .map((card) => [card.frontText, card.backText, card.tags.join(","), card.uniqueKey])
            .toSorted(byKey)
        ).toEqual(parsed.data.toSorted(byKey));
        await page.getByRole("button", { name: `Open cards in ${example.file}`, exact: true }).click();
        await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
        await expect(page.getByRole("article")).toHaveCount(example.count);
      });
    });
  }
}

for (const [key, path] of [
  ["s", "/settings"],
  ["i", "/import"],
] as const) {
  test(`PLAYWRIGHT-DECK-LIST-49 Deck list shortcut ${key} opens ${path} without changing saved data`, async ({
    page,
  }) => {
    await test.step("Given: a populated deck list", async () => {
      await launch(page);
    });
    const before = await inspect(page);
    await test.step("When: the list shortcut is pressed", async () => {
      await page.keyboard.press(key);
    });
    await test.step("Then: the requested real route opens and data stay unchanged", async () => {
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(
        page.getByRole("heading", { name: key === "s" ? "Settings" : "Add a deck", exact: true })
      ).toBeVisible();
      expect(await inspect(page)).toEqual(before);
    });
  });
}

test("PLAYWRIGHT-DECK-LIST-08 The header opens study history", async ({ page }) => {
  await test.step("Given: a populated deck list", async () => {
    await launch(page);
  });
  await test.step("When: the header's Study history button is activated", async () => {
    await page.getByRole("button", { name: "Study history", exact: true }).click();
  });
  await test.step("Then: the real history route and date range controls appear", async () => {
    await expect(page.getByRole("heading", { name: "Study history", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "30 days", exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-DECK-LIST-06 Aggregate review counts retain the five-due five-new display variant", async ({
  page,
}) => {
  await test.step("Given: due and new cards across three loaded decks", async () => {
    await launch(page, "aggregate-review");
  });
  await test.step("When: About counts is opened", async () => {
    await expect(page.getByRole("region", { name: "Decks", exact: true })).toBeVisible();
    await page.getByText("About counts", { exact: true }).click();
  });
  await test.step("Then: the aggregate and explanatory text are displayed", async () => {
    await expect(page.getByText("5 due · 5 new", { exact: true })).toBeVisible();
    await expect(page.getByText("Counts use data currently held on this device and saved filters.")).toBeVisible();
  });
});

test("PLAYWRIGHT-DECK-LIST-24 Arrow navigation can execute Edit without transient menu closure", async ({ page }) => {
  await test.step("Given: an unstarted deck menu", async () => {
    await launch(page);
    await page.getByRole("button", { name: `Open actions for ${otherName}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "View", exact: true }).focus();
  });
  await test.step("When: two arrow presses reach Edit and Enter activates it", async () => {
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Edit", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
  });
  await test.step("Then: the selected deck editor opens", async () => {
    await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(otherName);
  });
});

test("PLAYWRIGHT-DECK-LIST-26 A menu closes when its deck becomes pending and remains closed after recovery", async ({
  page,
}) => {
  await test.step("Given: an open active-deck menu and a held Continue operation", async () => {
    await launch(page, "continue-failure");
    await page.getByRole("button", { name: `Open actions for ${deckName}`, exact: true }).click();
    await expect(page.getByRole("menu")).toBeVisible();
  });
  const trigger = page.getByRole("button", { name: `Open actions for ${deckName}`, exact: true });
  await test.step("When: the existing Continue control receives activation without moving menu focus", async () => {
    await page.getByRole("button", { name: `Continue ${deckName}`, exact: true }).dispatchEvent("click");
  });
  await test.step("Then: pending disables its trigger and closes the existing menu", async () => {
    await expect(trigger).toBeDisabled();
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
  await test.step("When: the operation fails and restores controls", async () => {
    await callScenario(page, "decks", "finish");
  });
  await test.step("Then: enabling the trigger does not reopen its old menu", async () => {
    await expect(trigger).toBeEnabled();
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
});

test("PLAYWRIGHT-IMPORT-05 A combined diagnostic list translates every safe message and retains user context", async ({
  page,
}) => {
  await test.step("Given: all known parser diagnostic categories and an unknown category", async () => {
    await launch(page, "import-all-diagnostics");
    await expect(page.getByRole("alert")).toContainText('uniqueKey "自作キー" is duplicated');
  });
  await test.step("When: language changes to Japanese", async () => {
    await callScenario(page, "decks", "setLanguage", "ja");
  });
  await test.step("Then: all translated messages and the original context appear without internals", async () => {
    for (const text of [
      "一意キー「自作キー」がファイル内で重複しています。",
      "ユーザー入力",
      "列数は4列である必要があります（現在は2列）。",
      "CSVファイルが空です。",
      "フィールドの閉じ引用符の形式が正しくありません。",
      "CSVを解析できませんでした。形式を確認してください。",
    ])
      await expect(page.getByRole("alert")).toContainText(text);
    await expect(page.getByRole("alert")).not.toContainText("private diagnostic");
  });
});

for (const due of [0, 1]) {
  test(`PLAYWRIGHT-DECK-LIST-16 Primary action distinguishes ${due} due and two new cards`, async ({ page }) => {
    await test.step("Given: a deck with two new cards and the stated due count", async () => {
      await launch(page, due ? "primary-review" : "primary-new");
    });
    await test.step("When: the primary action is activated", async () => {
      await page
        .getByRole("button", { name: due ? `Review ${deckName}` : `Study new cards in ${deckName}`, exact: true })
        .click();
    });
    await test.step("Then: the selected deck's study setup reflects both groups", async () => {
      await expect(page.getByRole("heading", { name: deckName, exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: `Start ${due + 2} cards`, exact: true })).toBeEnabled();
      expect((await inspect(page)) as unknown).toMatchObject({ studyRequests: [] });
    });
  });
}

test("PLAYWRIGHT-DECK-LIST-50 Keyboard Review opens existing settings without saving the deck or starting a study", async ({
  page,
}) => {
  await test.step("Given: the loaded deck has one due and one new card", async () => {
    await launch(page, "one-review");
    await expect(page.getByText("1 due · 1 new", { exact: true })).toHaveCount(2);
  });
  const before = await inspect(page);
  await test.step("When: counts are explained and Review is activated with Enter", async () => {
    await page.getByText("About counts", { exact: true }).click();
    await expect(page.getByText("Counts use data currently held on this device and saved filters.")).toBeVisible();
    await page.getByRole("button", { name: `Review ${deckName}`, exact: true }).focus();
    await page.keyboard.press("Enter");
  });
  await test.step("Then: the selected deck's start route is shown with all data unchanged", async () => {
    await expect(page).toHaveURL(/\/deck\/contract-deck\/start$/);
    await expect(page.getByRole("heading", { name: deckName, exact: true })).toBeVisible();
    expect(await inspect(page)).toEqual(before);
  });
});
