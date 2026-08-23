import { expect, test } from "@playwright/test";
import { e2eConfig, getDocument, routeAnonymousAuth, seedConfig } from "./fixtures";

test("creates an empty remote Deck and its first Card from the UI", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await routeAnonymousAuth(page, "create-e2e-user");
  await seedConfig(page, { ...e2eConfig, loadSample: false });
  await page.goto("/");

  await page.getByRole("button", { name: "Create deck" }).click();
  await expect(page).toHaveURL(/\/deck\/new$/);
  await page.getByRole("textbox", { name: "Name" }).fill("Created in UI");
  await page.getByRole("button", { name: "Create deck" }).click();

  await expect(page).toHaveURL(/\/deck\/[A-Za-z0-9]{20}$/);
  await expect(page.getByRole("heading", { level: 1, name: "Cards" })).toBeVisible();
  await expect(page.getByText("0 cards")).toBeVisible();
  const deckId = new URL(page.url()).pathname.split("/").at(-1);
  if (deckId === undefined) throw new Error("Created Deck id is missing from the URL");
  const deckDocument = await getDocument("deck", deckId);
  expect(deckDocument.fields.name).toEqual(expect.objectContaining({ stringValue: "Created in UI" }));

  await page.getByRole("button", { name: "Add card" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deckId}/card/new$`));
  await page.getByRole("textbox", { name: "Front text" }).fill("Created question");
  await page.getByRole("textbox", { name: "Back text" }).fill("Created answer");
  await page.getByRole("button", { name: "Add card" }).click();

  await expect(page).toHaveURL(new RegExp(`/deck/${deckId}$`));
  await expect(page.getByRole("button", { name: "View Created question" })).toBeVisible();
  const storedCards = await page.evaluate(
    () => JSON.parse(window.localStorage.getItem("tango-local-cards") ?? "{}").state?.localCards ?? []
  );
  expect(storedCards).toEqual([]);
  expect(errors).toEqual([]);
});
