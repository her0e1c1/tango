import { expect, test } from "./utils/fixtures";
import { readFile } from "node:fs/promises";

test("DECK-TRANSFER-01 downloads every Card field as one CSV row", async ({ fixture, page }, testInfo) => {
  // Given: Prepare `deck`, `downloadPromise` and any shared test state below.
  const deck = fixture.deck();
  const { cards } = fixture.state.remote;
  await fixture.apply(page);
  await page.goto("/");

  const downloadPromise = page.waitForEvent("download");
  // When: Exercise `page.getByRole("button", { name: `Open actions for ${deck.name}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Download" }).click();
  const download = await downloadPromise;
  const path = testInfo.outputPath("deck.csv");
  await download.saveAs(path);
  const csv = await readFile(path, "utf8");

  // Then: Verify the expected result in the assertions below.
  expect(download.suggestedFilename()).toBe(`${deck.name}.csv`);
  const csvCell = (value: string) => (value.includes(",") ? `"${value.replaceAll('"', '""')}"` : value);
  for (const card of cards) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    expect(csv).toContain([card.frontText, card.backText, card.tags.join(","), card.uniqueKey].map(csvCell).join(","));
  }
  expect(csv.trim().split("\n")).toHaveLength(cards.length);
});
