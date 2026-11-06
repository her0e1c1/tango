import { expect, test } from "@playwright/test";

test("report viewer fixture", async ({ page }) => {
  await test.step("Given: A fixed test-only document", async () => {
    await page.goto("data:text/html,<title>Report fixture</title><h1>Report fixture</h1>");
  });
  await test.step("When: The document is inspected", async () => {
    await expect(page).toHaveTitle("Report fixture");
  });
  await test.step("Then: The recorded DOM has the fixture heading", async () => {
    await expect(page.getByRole("heading", { name: "Report fixture" })).toBeVisible();
  });
});
