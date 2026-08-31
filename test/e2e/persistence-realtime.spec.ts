import { collectBrowserErrors, documentId, expect, listDocuments, requireDocument, test } from "./fixtures";

test("PERSIST-03 reflects a remote Card edit in another open client without reload", async ({
  baseURL,
  browser,
  fixture,
  namespace,
  page,
}) => {
  const deck = fixture.deck();
  const card = fixture.card();
  const updatedFrontText = `${namespace.caseId} live update`;
  await fixture.seedRemote();
  await fixture.seedPage(page);

  const secondaryContext = await browser.newContext();
  const secondaryErrors = collectBrowserErrors(secondaryContext, baseURL);
  const secondaryPage = await secondaryContext.newPage();
  await fixture.seedPage(secondaryPage);

  try {
    await Promise.all([page.goto(`/deck/${deck.id}`), secondaryPage.goto(`/deck/${deck.id}`)]);
    await Promise.all([
      expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible(),
      expect(secondaryPage.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible(),
    ]);

    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByRole("textbox", { name: "Front text" }).fill(updatedFrontText);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(secondaryPage.getByRole("button", { name: `View ${updatedFrontText}` })).toBeVisible();
    await expect(secondaryPage.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
    await expect
      .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
      .toBe(updatedFrontText);

    const matchingCards = (await listDocuments("card")).filter(
      ({ fields }) =>
        fields.uid?.stringValue === card.uid &&
        fields.deckId?.stringValue === deck.id &&
        fields.uniqueKey?.stringValue === card.uniqueKey
    );
    expect(matchingCards.map(documentId)).toEqual([card.id]);
    secondaryErrors.assert();
  } finally {
    await secondaryContext.close();
  }
});
