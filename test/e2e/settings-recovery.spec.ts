import { expect, test } from "./fixtures";

test("SETTINGS-06 recovers current defaults from invalid persisted preferences", async ({ fixture, page }) => {
  await fixture.apply(page);
  await page.goto("/settings");
  await page.evaluate(() => {
    localStorage.setItem("tango-config", JSON.stringify({ state: { preferences: "invalid" }, version: 1 }));
  });

  await page.reload();

  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Dark mode" })).not.toBeChecked();
  await expect(page.getByRole("slider", { name: "Maximum cards" })).toHaveValue("10");
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("system");
});
