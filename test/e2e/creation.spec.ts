import {
  allowExpectedFirestoreWriteFailure,
  documentId,
  expect,
  failNextFirestoreWrite,
  listDocuments,
  readLocalData,
  test,
} from "./fixtures";

test("DECK-11 creates one empty local-only Deck without a remote duplicate", async ({ fixture, page, namespace }) => {
  const name = `${namespace.caseId} local deck`;
  const category = "typescript";
  await fixture.apply(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Create deck" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("combobox").selectOption(category);
  const localOnly = page.getByRole("checkbox", { name: "Local only" });
  await localOnly.locator("xpath=parent::label").click();
  await expect(localOnly).toBeChecked();
  await page.getByRole("button", { name: "Create deck" }).click();
  await expect(page).toHaveURL(/\/deck\/(?!new$)[^/]+$/);
  await expect(page.getByRole("status").filter({ hasText: `Created deck “${name}”.` })).toBeVisible();
  const deckId = new URL(page.url()).pathname.split("/").at(-1);
  if (deckId === undefined) throw new Error("Created local-only Deck ID is missing");
  await expect(page.getByText("0 cards")).toBeVisible();

  await page.goto("/");
  await page.reload();

  const deckArticle = page.getByRole("button", { name: `View ${name}` }).locator("xpath=ancestor::article[1]");
  await expect(deckArticle).toContainText(category);
  const local = await readLocalData(page);
  const localDecks = local.decks.filter(
    (deck: { id?: string; name?: string }) => deck.id === deckId && deck.name === name
  );
  expect(localDecks).toHaveLength(1);
  expect(localDecks[0]).toEqual(expect.objectContaining({ id: deckId, name, category, localMode: true }));
  expect(local.cards.filter((card: { deckId?: string }) => card.deckId === deckId)).toEqual([]);
  expect(
    (await listDocuments("deck")).filter(
      (document) =>
        (document.fields.name as { stringValue?: string } | undefined)?.stringValue === name ||
        documentId(document) === deckId
    )
  ).toEqual([]);
});

test("CARD-15 retries a failed remote Card create with the same ID and no duplicate", async ({
  fixture,
  page,
  browserErrors,
  namespace,
}) => {
  const deck = fixture.deck();
  const frontText = `${namespace.caseId} retry front`;
  const backText = `${namespace.caseId} retry back`;
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: "Add card" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));

  let attemptedCardId: string | undefined;
  page.on("request", (request) => {
    if (!request.url().includes("google.firestore.v1.Firestore/Write/channel")) return;
    const body = decodeURIComponent((request.postData() ?? "").replaceAll("+", "%20"));
    attemptedCardId ??= /\/documents\/card\/([a-zA-Z0-9-]+)/.exec(body)?.[1];
  });
  const fault = await failNextFirestoreWrite(page, { collection: "card" });
  allowExpectedFirestoreWriteFailure(browserErrors);
  await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
  await page.getByRole("textbox", { name: "Back text" }).fill(backText);
  await page.getByRole("button", { name: "Create card" }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to create this card. Try again.");
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await fault.dispose();
  expect(attemptedCardId).toBeDefined();

  await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue(frontText);
  await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue(backText);
  await page.getByRole("button", { name: "Create card" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: `Created card “${frontText}”.` })).toBeVisible();
  await page.reload();

  await expect(page.getByRole("button", { name: `View ${frontText}` })).toBeVisible();
  const created = (await listDocuments("card")).filter(
    ({ fields }) =>
      fields.deckId?.stringValue === deck.id &&
      fields.uid?.stringValue === deck.uid &&
      fields.frontText?.stringValue === frontText
  );
  expect(created).toHaveLength(1);
  const [createdCard] = created;
  if (createdCard === undefined) throw new Error("Created remote Card was not found");
  expect(documentId(createdCard)).toBe(attemptedCardId);
  expect(createdCard.fields.backText?.stringValue).toBe(backText);
  expect(createdCard.fields.uniqueKey?.stringValue).toBe(attemptedCardId);
  expect((await readLocalData(page)).cards).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ frontText })])
  );
});
