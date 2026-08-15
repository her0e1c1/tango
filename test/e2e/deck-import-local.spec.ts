import { expect, test } from "@playwright/test";
import { routeAnonymousAuth, seedConfig } from "./fixtures";

test("restores an imported local-only Deck for list and study flows", async ({ page }) => {
  await routeAnonymousAuth(page, "local-import-user");
  await seedConfig(page);
  await page.goto("/import");

  await page.getByRole("radio", { name: /Local only/ }).check();
  await page.getByLabel("Upload a csv file").setInputFiles({
    name: "local-import.csv",
    mimeType: "text/csv",
    buffer: Buffer.from('"local front","local back","tag","local-key"'),
  });
  await expect(page.getByText("1 create")).toBeVisible();
  await page.getByRole("button", { name: "Import", exact: true }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "View local-import.csv" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "View local-import.csv" })).toBeVisible();
  await page.getByRole("button", { name: "Study local-import.csv" }).click();
  await page.getByRole("button", { name: "Start 1 card" }).click();
  await expect(page.getByText("local front")).toBeVisible();
});
