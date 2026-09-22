import type { Page } from "@playwright/test";
import * as Papa from "papaparse";
import { expect } from "./fixtures";

export async function createAnonymousDeck(page: Page) {
  const deck = { id: "", name: "Local Deck" };
  const first = { id: "", frontText: "local first", backText: "local first answer" };
  const second = { id: "", frontText: "local second", backText: "local second answer" };
  const cards = [first, second];
  await page.goto("/deck/new");
  await page.getByRole("textbox", { name: "Name" }).fill(deck.name);
  await page.getByRole("button", { name: "Create deck", exact: true }).click();
  await expect(page).toHaveURL(/\/deck\/(?!new$)[^/]+$/);
  deck.id = decodeURIComponent(new URL(page.url()).pathname.split("/").at(-1) ?? "");
  for (const card of cards) {
    await page.goto(`/deck/${deck.id}/card/new`);
    await page.getByRole("textbox", { name: "Front text" }).fill(card.frontText);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(card.backText);
    await page.getByRole("button", { name: "Create card", exact: true }).click();
    await expect(page).toHaveURL(`/deck/${deck.id}`);
    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    await expect(page).toHaveURL(/\/card\/[^/]+\/edit$/);
    card.id = decodeURIComponent(new URL(page.url()).pathname.split("/").at(-2) ?? "");
  }
  return { deck, first, second, cards };
}

export async function startAnonymousStudy(page: Page, deckId: string) {
  await page.goto(`/deck/${deckId}/start`);
  await page.getByRole("button", { name: "Start 2 cards", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("0");
  return page.locator("#frontText").innerText();
}

export async function downloadDeckCards(page: Page, deckName: string) {
  await page.goto("/");
  await page.getByRole("button", { name: `Open actions for ${deckName}`, exact: true }).click();
  const ready = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Download", exact: true }).click();
  const download = await ready;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const parsed = Papa.parse<string[]>(Buffer.concat(chunks).toString("utf8"), { skipEmptyLines: true });
  expect(parsed.errors).toEqual([]);
  return parsed.data.map(([frontText, backText, tags, uniqueKey]) => ({
    frontText,
    backText,
    tags: tags ? tags.split(",") : [],
    uniqueKey,
  }));
}
