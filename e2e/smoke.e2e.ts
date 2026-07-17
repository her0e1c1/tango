import { expect, test } from "@playwright/test";
import { routeAnonymousAuth, seedConfig } from "./fixtures";

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await routeAnonymousAuth(page, "smoke-e2e-user");
  await seedConfig(page);
  await page.exposeFunction("assertNoBrowserErrors", () => expect(errors).toEqual([]));
});

test("shows the deck list smoke screen", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("tango")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("No decks yet.");
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("shows settings and persists a device setting", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByText("Settings")).toBeVisible();
  const darkMode = page.locator('input[name="darkMode"]');
  await expect(darkMode).not.toBeChecked();
  await page.locator('input[name="darkMode"] + span').click();
  await expect(darkMode).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(window.localStorage.getItem("tango-config") ?? "{}").state?.config?.darkMode)
    )
    .toBe(true);
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("shows the import screen", async ({ page }) => {
  await page.goto("/import");

  await expect(page.getByRole("heading", { level: 1, name: "Import decks", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Choose a CSV file", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "CSV format", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Sample", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add sample deck" })).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});
