import { expect, test } from "./utils/fixtures";
import { readFile } from "node:fs/promises";

test("DECK-TRANSFER-01 downloads every Card field as one CSV row", async ({ fixture, page }, testInfo) => {
  const deck = fixture.deck();
  const { cards } = fixture.state.remote;
  await fixture.apply(page);
  await page.goto("/");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Download" }).click();
  const download = await downloadPromise;
  const path = testInfo.outputPath("deck.csv");
  await download.saveAs(path);
  const csv = await readFile(path, "utf8");

  expect(download.suggestedFilename()).toBe(`${deck.name}.csv`);
  const csvCell = (value: string) => (value.includes(",") ? `"${value.replaceAll('"', '""')}"` : value);
  for (const card of cards) {
    expect(csv).toContain([card.frontText, card.backText, card.tags.join(","), card.uniqueKey].map(csvCell).join(","));
  }
  expect(csv.trim().split("\n")).toHaveLength(cards.length);
});
