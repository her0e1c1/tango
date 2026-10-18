import { expect, listDocuments, requireDocument, test } from "./utils/fixtures";
import { readProgress, readSession } from "./utils/study-helpers";
import { createAnonymousDeck, startAnonymousStudy } from "./utils/ui-helpers";
import type { Page } from "@playwright/test";

const readSelectedTags = async (deckId: string): Promise<string[]> =>
  ((await requireDocument("deck", deckId)).fields.studyFilter?.mapValue?.fields?.selectedTags?.arrayValue?.values ?? [])
    .map((value) => value.stringValue)
    .filter((value): value is string => value !== undefined);

test("STUDY-SESSION-08 reveals, persists, and applies an additional Study tag", async ({ fixture, page }) => {
  const { deck, targetCard, targetTag } =
    await test.step("Given: Study settings with additional tags initially hidden", async () => {
      const deck = fixture.deck();
      const targetCard = fixture.card("card-list-actions-01");
      await fixture.apply(page);
      await page.goto(`/deck/${deck.id}/start`);

      const targetTag = page.getByRole("checkbox", { name: "tag-10", exact: true });
      await expect(targetTag).toHaveCount(0);
      return { deck, targetCard, targetTag };
    });
  await test.step("When: Reveal the remaining study tags", async () => {
    await page.getByRole("button", { name: "Show 2 more tags" }).click();
  });
  await test.step("Then: The additional target tag becomes visible", async () => {
    await expect(targetTag).toBeVisible();
  });
  await test.step("When: Select the additional study tag", async () => {
    await targetTag.locator("xpath=parent::label").click();
  });
  await test.step("Then: The filter saves automatically and allows one card", async () => {
    await expect(targetTag).toBeChecked();
    await expect(page.getByRole("button", { name: "Start 1 card" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Save filters" })).toHaveCount(0);
    await expect.poll(() => readSelectedTags(deck.id)).toEqual(["tag-10"]);
  });
  await test.step("When: Reload the study settings", async () => {
    await page.reload();
  });
  await test.step("Then: The additional tag stays visible and selected", async () => {
    await expect(targetTag).toBeVisible();
    await expect(targetTag).toBeChecked();
  });
  await test.step("When: Start the filtered study session", async () => {
    await page.getByRole("button", { name: "Start 1 card" }).click();
  });
  await test.step("Then: The selected card is the only card in the saved session", async () => {
    await expect(page.getByText(targetCard.frontText, { exact: true })).toBeVisible();
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.cardOrderIds)
      .toEqual([targetCard.id]);
  });
});

async function completeStudy(page: Page, deck: { id: string }, cards: readonly unknown[]) {
  await page.goto(`/deck/${encodeURIComponent(deck.id)}/start`);
  await page.getByRole("button", { name: `Start ${String(cards.length)} cards` }).click();
  for (let index = 0; index < cards.length; index += 1) {
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue(String(index));
    await page.getByRole("button", { name: "Swipe right: Good" }).click();
  }
  await page.getByRole("button", { name: "Back to deck list" }).click();
  await page.getByRole("button", { name: "Study history", exact: true }).click();
}

async function expectCompletedHistory(page: Page, deck: { name: string }, cards: readonly unknown[]) {
  await expect(page.getByRole("heading", { level: 1, name: "Study history" })).toBeVisible();
  await page.getByText("Show daily counts · 30 days").click();
  await expect(page.getByRole("row")).toHaveCount(31);
  await expect(page.getByRole("row").nth(1).getByRole("cell")).toHaveText(["1", "1"]);
  await expect(page.locator("dl").first().locator("dd")).toHaveText(["1", "1"]);
  await expect(page.getByRole("img", { name: /Starts and completions in the selected period/ })).toBeVisible();
  const recent = page.getByRole("region", { name: "Recent sessions" });
  await expect(recent.getByRole("listitem")).toHaveCount(1);
  await expect(recent.getByRole("heading", { name: deck.name })).toBeVisible();
  await expect(recent.locator("dd").nth(2)).toHaveText(String(cards.length));
  await expect(recent.getByText("Completed", { exact: true })).toBeVisible();
  await expect(recent.locator("dd").nth(0)).not.toHaveText("—");
  await expect(recent.locator("dd").nth(1)).not.toHaveText("—");
}

test("STUDY-SESSION-09 shows independent starts and completions after studying", async ({ fixture, page }) => {
  await test.step("Given: A remote deck ready for a complete study session", async () => {
    await fixture.apply(page);
  });
  await test.step("When: Complete study and open its history", async () => {
    await completeStudy(page, fixture.deck(), fixture.state.remote.cards);
  });
  await test.step("Then: History shows one start and one completion", async () => {
    await expectCompletedHistory(page, fixture.deck(), fixture.state.remote.cards);
  });
});

test("STUDY-SESSION-10 keeps Deck selection in the URL across navigation and reload", async ({ fixture, page }) => {
  const { deck } = await test.step("Given: A deck with no study records", async () => {
    await fixture.apply(page);
    await page.goto("/");
    const deck = fixture.deck();
    return { deck };
  });
  await test.step("When: Open study history from that deck", async () => {
    await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
    await page.getByRole("menuitem", { name: "Study history" }).click();
  });
  await test.step("Then: The URL-scoped deck is selected", async () => {
    await expect(page.getByRole("combobox", { name: "Deck", exact: true })).toHaveValue(deck.id);
  });
  await test.step("When: Select all decks and navigate back", async () => {
    await page.getByRole("combobox").selectOption("");
    await page.goBack();
  });
  await test.step("Then: The original deck selection is restored", async () => {
    await expect(page.getByRole("combobox")).toHaveValue(deck.id);
  });
  await test.step("When: Navigate forward", async () => {
    await page.goForward();
  });
  await test.step("Then: All-decks selection returns", async () => {
    await expect(page.getByRole("combobox")).toHaveValue("");
  });
  await test.step("When: Reload study history", async () => {
    await page.reload();
  });
  await test.step("Then: The all-decks selection and empty state remain", async () => {
    await expect(page.getByRole("combobox")).toHaveValue("");
    await expect(page.getByText("No study records in this period.")).toBeVisible();
  });
  await test.step("When: Expand daily counts", async () => {
    await page.getByText("Show daily counts · 30 days").click();
  });
  await test.step("Then: Thirty days of history are available", async () => {
    await expect(page.getByRole("row")).toHaveCount(31);
  });
});

test("STUDY-SESSION-11 keeps unavailable Deck selection without displaying all history", async ({
  fixture,
  page,
  namespace,
}) => {
  await test.step("Given: History for an unavailable deck without a fallback to all history", async () => {
    await fixture.apply(page);
    const path = `/study-history?deckId=${namespace.id("missing")}`;
    await page.goto(path);
    await expect(page.getByRole("status").filter({ hasText: "The selected deck is unavailable." })).toHaveText(
      "The selected deck is unavailable.All decks"
    );
    expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(path);
    await expect(page.getByRole("table")).toHaveCount(0);
  });
  await test.step("When: Choose all decks and expand daily counts", async () => {
    await page.getByRole("button", { name: "All decks" }).click();
    await page.getByText("Show daily counts · 30 days").click();
  });
  await test.step("Then: The all-decks history table opens", async () => {
    await expect(page.getByRole("table")).toBeVisible();
  });
});

test("STUDY-SESSION-12 restores anonymous study history from the device cache", async ({ fixture, page }) => {
  const { deck, cards } =
    await test.step("Given: An anonymous deck with completed study history in its cache", async () => {
      await fixture.apply(page);
      const local = await createAnonymousDeck(page);
      const { deck, cards } = local;

      await completeStudy(page, deck, cards);
      await expectCompletedHistory(page, deck, cards);
      return { deck, cards };
    });
  await test.step("When: Reload anonymous study history", async () => {
    await page.reload();
  });
  await test.step("Then: History and local-only storage guidance are restored", async () => {
    await expectCompletedHistory(page, deck, cards);
    await expect(page.getByText(/Anonymous data is stored only on this browser/)).toBeVisible();
    await expect(page.getByText(/Cloud history may be incomplete/)).toBeVisible();
  });
});

test("STUDY-SESSION-13 selects presets and inclusive dates while preserving Deck and URL navigation", async ({
  fixture,
  page,
}) => {
  await test.step("Given: Study history at its initial period", async () => {
    await fixture.apply(page);
    await page.goto("/study-history");
  });
  await test.step("When: Select seven days and expand daily counts", async () => {
    await page.getByRole("button", { name: "7 days" }).click();
    await page.getByText("Show daily counts · 7 days").click();
  });
  await test.step("Then: Seven daily rows and their heading are shown", async () => {
    await expect(page.getByRole("row")).toHaveCount(8);
  });
  await test.step("When: Select the ninety-day period", async () => {
    await page.getByRole("button", { name: "90 days" }).click();
  });
  await test.step("Then: The chart groups counts by seven days", async () => {
    await expect(page.getByText("Study counts per 7 days")).toBeVisible();
  });
  await test.step("When: Expand the ninety-day daily table", async () => {
    await page.getByText("Show daily counts · 90 days").click();
  });
  await test.step("Then: The first thirty daily rows are shown", async () => {
    await expect(page.getByRole("row")).toHaveCount(31);
  });
  await test.step("When: Page to the oldest dates", async () => {
    await page.getByRole("button", { name: "Older dates" }).click();
    await page.getByRole("button", { name: "Older dates" }).click();
  });
  await test.step("Then: The final thirty days are shown without another page", async () => {
    await expect(page.getByText("61–90 of 90 days")).toBeVisible();
    await expect(page.getByRole("button", { name: "Older dates" })).toBeDisabled();
  });
  await test.step("When: Apply an inclusive custom range, select a deck and navigate back", async () => {
    await page.getByRole("button", { name: "Custom range" }).click();
    await page.getByLabel("Start date").fill("2020-12-31");
    await page.getByLabel("End date").fill("2021-01-02");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.getByRole("combobox").selectOption(fixture.deck().id);
    await page.goBack();
  });
  await test.step("Then: Back restores the all-decks selection", async () => {
    await expect(page.getByRole("combobox")).toHaveValue("");
  });
  await test.step("When: Navigate forward and reload", async () => {
    await page.goForward();
    await page.reload();
  });
  await test.step("Then: The deck and both custom range endpoints survive reload", async () => {
    await expect(page.getByRole("combobox")).toHaveValue(fixture.deck().id);
    await expect(page.getByLabel("Start date")).toHaveValue("2020-12-31");
    await expect(page.getByLabel("End date")).toHaveValue("2021-01-02");
    await expect(page.getByText("No study records in this period.")).toBeVisible();
  });
  await test.step("When: Expand the custom daily counts", async () => {
    await page.getByText("Show daily counts · 3 days").click();
  });
  await test.step("Then: Both endpoint dates appear in the inclusive range", async () => {
    await expect(page.getByRole("row")).toHaveCount(4);
    await expect(page.getByRole("row", { name: "Dec 31, 2020 0 0" })).toBeVisible();
    await expect(page.getByRole("row", { name: "Jan 2, 2021 0 0" })).toBeVisible();
  });
});

const cardAt = <T>(cards: readonly T[], index: number) => {
  const card = cards[index];
  if (card === undefined) throw new Error(`Missing Card fixture at index ${String(index)}`);
  return card;
};

const swipeFrontUp = async (page: Page, frontText: string, button: "left" | "middle" | "right" = "left") => {
  const box = await page.getByRole("button", { name: frontText, exact: true }).boundingBox();
  if (box == null) throw new Error("Study card front is not visible");
  const x = box.x + box.width / 2;
  await page.mouse.move(x, box.y + box.height * 0.5);
  await page.mouse.down({ button });
  await page.mouse.move(x, box.y + box.height * 0.2, { steps: 5 });
  await page.mouse.up({ button });
};

const returnToDeckList = async (page: Page) => {
  await page.getByRole("button", { name: "Open card actions" }).click();
  await page.getByRole("button", { name: "Back to deck list" }).click();
};

test("STUDY-SESSION-01 starts a filtered session capped by the learning limit", async ({ fixture, page }) => {
  const { deck, firstCard, secondCard, eligibleBeyondLimit, otherTagExcluded, tagOnlyExcluded } =
    await test.step("Given: A deck with eligible and excluded cards under saved study filters", async () => {
      const deck = fixture.deck();
      const firstCard = fixture.card("card-1");
      const secondCard = fixture.card("card-2");
      const eligibleBeyondLimit = fixture.card("card-3");
      const otherTagExcluded = fixture.card("card-4");
      const tagOnlyExcluded = fixture.card("card-5");
      await fixture.apply(page);
      await page.goto("/settings");
      await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
      return { deck, firstCard, secondCard, eligibleBeyondLimit, otherTagExcluded, tagOnlyExcluded };
    });

  for (const maximum of [fixture.state.browser.preferences.study.maxNumberOfCardsToLearn, 0, 1]) {
    await test.step("When: Set the iteration learning limit when it differs from the initial value", async () => {
      if (maximum !== fixture.state.browser.preferences.study.maxNumberOfCardsToLearn) {
        await page.goto("/settings");
        const slider = page.getByRole("slider", { name: "Maximum cards" });
        await slider.press("Home");
        if (maximum === 1) await slider.press("ArrowRight");
      }
    });
    const { expectedIds } = await test.step("Then: The requested learning limit is saved", async () => {
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.study
                ?.maxNumberOfCardsToLearn
          )
        )
        .toBe(maximum);
      const matchingIds = [firstCard.id, secondCard.id, eligibleBeyondLimit.id];
      const expectedIds = maximum === 0 ? matchingIds : matchingIds.slice(0, maximum);
      return { expectedIds };
    });
    const { countLabel } = await test.step("When: Open study settings for that learning limit", async () => {
      const countLabel = `${String(expectedIds.length)} ${expectedIds.length === 1 ? "card" : "cards"}`;
      await page.goto(`/deck/${deck.id}/start`);
      return { countLabel };
    });
    await test.step("Then: The eligible session count respects the limit", async () => {
      await expect(page.getByRole("heading", { level: 2, name: `${countLabel} in this session` })).toBeVisible();
    });
    await test.step("When: Start the filtered session", async () => {
      await page.getByRole("button", { name: `Start ${countLabel}` }).click();
    });
    await test.step("Then: Only matching cards within the limit enter the saved session", async () => {
      await expect(page.getByText(firstCard.frontText, { exact: true })).toBeVisible();
      await expect
        .poll(async () => (await readSession(fixture.user().uid, deck.id))?.cardOrderIds)
        .toEqual(expectedIds);
      const stored = await readSession(fixture.user().uid, deck.id);
      expect(stored?.cardOrderIds).not.toContain(otherTagExcluded.id);
      expect(stored?.cardOrderIds).not.toContain(tagOnlyExcluded.id);
    });
  }
});

test("STUDY-SESSION-02 prevents an empty filtered session from starting", async ({ fixture, page }) => {
  const { deck } = await test.step("Given: A deck whose saved study filters match no cards", async () => {
    const deck = fixture.deck();
    await fixture.apply(page);
    return { deck };
  });
  await test.step("When: Open study settings", async () => {
    await page.goto(`/deck/${deck.id}/start`);
  });
  await test.step("Then: Starting an empty session is disabled and creates no session", async () => {
    await expect(page.getByText("No cards match your filters.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
    expect(await readSession(fixture.user().uid, deck.id)).toBeUndefined();
  });
});

test("STUDY-SESSION-03 returns and continues from the same Card", async ({ fixture, page }) => {
  const { deck, session, currentCard, beforeContinue } =
    await test.step("Given: An active session left at its current card on the deck list", async () => {
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-2");
      await fixture.apply(page);

      await page.goto(`/deck/${deck.id}/study`);
      await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
      await returnToDeckList(page);
      await expect(page).toHaveURL(/\/$/);
      const beforeContinue = await readSession(fixture.user().uid, deck.id);
      return { deck, session, currentCard, beforeContinue };
    });
  await test.step("When: Continue studying the deck", async () => {
    await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  });
  await test.step("Then: The same session and card resume with updated recency", async () => {
    await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
    await expect.poll(async () => (await readSession(fixture.user().uid, deck.id))?.sessionId).toBe(session.sessionId);
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex);
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.lastStudiedAt)
      .toBeGreaterThan(beforeContinue?.lastStudiedAt ?? session.lastStudiedAt);
  });
});

test("STUDY-SESSION-04 restarts an in-progress Deck from a new session", async ({ fixture, page }) => {
  const { deck, cards, previous } = await test.step("Given: A deck with a previous in-progress session", async () => {
    const deck = fixture.deck();
    const { cards } = fixture.state.remote;
    const previous = fixture.session();
    await fixture.apply(page);

    await page.goto("/");
    return { deck, cards, previous };
  });
  await test.step("When: Restart the deck and begin study", async () => {
    await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
    await page.getByRole("menuitem", { name: "Restart" }).click();
    await page.getByRole("button", { name: `Start ${String(cards.length)} cards` }).click();
  });
  await test.step("Then: A new session starts from the first card", async () => {
    await expect(page.getByText(cardAt(cards, 0).frontText, { exact: true })).toBeVisible();
    await expect
      .poll(async () => {
        const restarted = await readSession(fixture.user().uid, deck.id);
        return restarted !== undefined && restarted.sessionId !== previous.sessionId && restarted.currentIndex === 0;
      })
      .toBe(true);
  });
});

test("STUDY-SESSION-05 finishes the final Card and shows the completion screen", async ({ fixture, page }) => {
  const { deck, session, finalCard } = await test.step("Given: A study session at its final card", async () => {
    const deck = fixture.deck();
    const session = fixture.session();
    const finalCard = fixture.card("card-3");
    await fixture.apply(page);

    await page.goto(`/deck/${deck.id}/study`);
    return { deck, session, finalCard };
  });
  await test.step("When: Rate the final card Easy", async () => {
    await page.getByRole("button", { name: "Swipe up: Easy" }).click();
  });
  const { backToDeckList } =
    await test.step("Then: The completion screen receives focus and describes the session", async () => {
      await expect(page).toHaveURL(`/deck/${deck.id}/study`);
      await expect(page.getByRole("heading", { name: "Study complete" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Study complete" })).toBeFocused();
      await expect(page.getByText(`Session: ${String(session.cardOrderIds.length)} cards`)).toBeVisible();
      const backToDeckList = page.getByRole("button", { name: "Back to deck list" });
      await expect(backToDeckList).toBeVisible();
      return { backToDeckList };
    });
  await test.step("When: Return to the deck list", async () => {
    await backToDeckList.click();
  });
  await test.step("Then: The completed session cannot be continued and final progress is saved", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toHaveCount(0);
    await expect.poll(() => readProgress(finalCard.id)).toEqual({ reps: 1 });
    expect(session.currentIndex).toBe(session.cardOrderIds.length - 1);
    expect(await readSession(fixture.user().uid, deck.id)).toBeUndefined();
  });
});

test("STUDY-SESSION-06 keeps multiple Deck sessions independent", async ({ fixture, page }) => {
  const { deckA, deckB, sessionA, sessionB, currentCardA, currentCardB } =
    await test.step("Given: Two decks with independent active sessions", async () => {
      const deckA = fixture.deck("deck-a");
      const deckB = fixture.deck("deck-b");
      const sessionA = fixture.session("deck-a");
      const sessionB = fixture.session("deck-b");
      const currentCardA = fixture.card("card-a-1");
      const currentCardB = fixture.card("card-b-2");
      await fixture.apply(page);

      await page.goto(`/deck/${deckA.id}/study`);
      return { deckA, deckB, sessionA, sessionB, currentCardA, currentCardB };
    });
  await test.step("When: Rate a card in the first deck and leave study", async () => {
    await page.getByRole("button", { name: "Swipe up: Easy" }).click();
    await returnToDeckList(page);
  });
  await test.step("Then: The deck list opens", async () => {
    await expect(page).toHaveURL(/\/$/);
  });
  await test.step("When: Continue the second deck", async () => {
    await page.getByRole("button", { name: `Continue ${deckB.name}` }).click();
  });
  await test.step("Then: Only the first deck progress has advanced", async () => {
    await expect(page.getByText(currentCardB.frontText, { exact: true })).toBeVisible();
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deckA.id))?.currentIndex)
      .toBe(sessionA.currentIndex + 1);
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deckB.id))?.currentIndex)
      .toBe(sessionB.currentIndex);
    await expect.poll(() => readProgress(currentCardA.id)).toEqual({ reps: 1 });
    await expect.poll(() => readProgress(currentCardB.id)).toEqual({ reps: 0 });
  });
});

test("STUDY-SESSION-07 preserves local-only progress and session position across reload", async ({ fixture, page }) => {
  const { deck, currentCard, nextCard } =
    await test.step("Given: An anonymous session advanced once with review scheduling enabled", async () => {
      await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
      const local = await createAnonymousDeck(page);
      const { deck } = local;
      const frontText = await startAnonymousStudy(page, deck.id);
      const currentCard = frontText === local.first.frontText ? local.first : local.second;
      const nextCard = currentCard === local.first ? local.second : local.first;

      await page.goto(`/deck/${deck.id}/study`);
      await swipeFrontUp(page, currentCard.frontText);
      await page.getByText(nextCard.frontText, { exact: true }).waitFor();
      return { deck, currentCard, nextCard };
    });
  await test.step("When: Reload the active session", async () => {
    await page.reload();
  });
  await test.step("Then: The next card front and position are restored", async () => {
    await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
    await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("1");
  });
  await test.step("When: Return home and continue the deck", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  });
  await test.step("Then: The same next card resumes", async () => {
    await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  });
  await test.step("When: Open the previously rated card", async () => {
    await page.goto(`/card/${currentCard.id}`);
  });
  const { dueMinute } = await test.step("Then: Its FSRS memory includes a valid next review time", async () => {
    await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
    const nextReview = await page
      .getByRole("term")
      .filter({ hasText: /^Next review$/ })
      .locator("..")
      .locator("dd")
      .textContent();
    const dueMinute = Date.parse(nextReview ?? "");
    expect(Number.isFinite(dueMinute)).toBe(true);
    return { dueMinute };
  });
  await test.step("When: Open study settings before that review is due", async () => {
    await page.goto(`/deck/${deck.id}/start`);
  });
  await test.step("Then: Only the remaining card is available to start", async () => {
    await expect(page.getByRole("button", { name: "Start 1 card", exact: true })).toBeEnabled();
  });
  await test.step("When: Reload study settings", async () => {
    await page.reload();
  });
  await test.step("Then: The available card count remains one", async () => {
    await expect(page.getByRole("button", { name: "Start 1 card", exact: true })).toBeEnabled();
  });
  await test.step("When: Set the clock before the public review minute and refresh counts", async () => {
    // The public date display has minute precision; cross that whole minute with the page still open.
    await page.clock.install({ time: new Date(dueMinute - 60_000) });
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  });
  await test.step("Then: The rated card is still excluded", async () => {
    await expect(page.getByRole("button", { name: "Start 1 card", exact: true })).toBeEnabled();
  });
  await test.step("When: Advance across the entire review minute", async () => {
    await page.clock.runFor(120_000);
  });
  await test.step("Then: Both cards are now available to study", async () => {
    await expect(page.getByRole("button", { name: "Start 2 cards", exact: true })).toBeEnabled();
  });
  await test.step("When: Start studying both due cards", async () => {
    await page.getByRole("button", { name: "Start 2 cards", exact: true }).click();
  });
  await test.step("Then: The previously rated card is first", async () => {
    await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  });
  await test.step("When: Rate that card Good again", async () => {
    await page.getByRole("button", { name: "Swipe right: Good", exact: true }).click();
  });
  await test.step("Then: Study advances to the next card", async () => {
    await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  });
  await test.step("When: Reload the active anonymous session", async () => {
    await page.reload();
  });
  await test.step("Then: The next position persists without writing any remote records", async () => {
    await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
    for (const collection of ["deck", "card", "studySession", "studyAnswer"] as const) {
      expect(
        (await listDocuments(collection)).filter(({ fields }) => fields.uid?.stringValue === fixture.user().uid)
      ).toEqual([]);
    }
  });
});
