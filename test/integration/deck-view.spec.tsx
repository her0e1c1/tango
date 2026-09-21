import { setStudySessionIndex } from "@/entities/study-session/model/actions/setStudySessionIndex";
import "@/test/mockFirestorePersistence";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/app/App";
import { appRoutes } from "@/app/routes";
import { replaceAuthSession } from "@/entities/auth";
import { createCard, getCards } from "@/entities/card";
import { createDeck, deleteDeck, getDecks } from "@/entities/deck";
import { getPreferences, updatePreferences } from "@/entities/preference";
import { clearStudySessions, getStudySession } from "@/entities/study-session";
import { startStudy } from "@/test/entityFixtures";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/app/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/app/firestore-subscriptions", () => ({
  FirestoreSubscriptionsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const ownedDeckIds: string[] = [];

async function seedLocalDeck(deck: ReturnType<typeof createLocalDeck>, cards: ReturnType<typeof createLocalCard>[]) {
  await createDeck("user-id", deck);
  ownedDeckIds.push(deck.id);
  for (const card of cards) await createCard("user-id", card);
}

function savedState(deckId: string) {
  return structuredClone({
    decks: getDecks(),
    cards: getCards(),
    preferences: getPreferences(),
    session: getStudySession(deckId),
    persisted: {
      decks: localStorage.getItem("tango-local-decks"),
      cards: localStorage.getItem("tango-local-cards"),
      preferences: localStorage.getItem("tango-config"),
      sessions: localStorage.getItem("tango-study"),
    },
  });
}

describe("DECK-NAVIGATION-04 DECK-NAVIGATION-05 DECK-NAVIGATION-09 DECK-NAVIGATION-10 DECK-NAVIGATION-11 Deck View through App, routes, local Entities, and persistence", () => {
  beforeEach(() => {
    replaceAuthSession({ status: "authenticated", uid: "user-id", displayName: null, isAnonymous: true });
    updatePreferences(createPreferences({ loadSample: false, language: "en" }));
    clearStudySessions();
  });

  afterEach(async () => {
    vi.useRealTimers();
    cleanup();
    for (const deckId of ownedDeckIds) await deleteDeck("user-id", deckId);
    ownedDeckIds.length = 0;
    clearStudySessions();
    replaceAuthSession({ status: "initializing" });
  });

  it("keeps an existing study resume point and saved data unchanged across viewing, reload, reentry, and both exits", async () => {
    const deck = createLocalDeck({ id: "view-local", name: "Local View Deck" });
    const cards = ["First", "Second", "Third"].map((name, index) =>
      createLocalCard({
        id: `view-card-${String(index)}`,
        deckId: deck.id,
        frontText: `${name} prompt`,
        backText: `${name} answer`,
        uniqueKey: name,
        difficulty: index + 3,
        numberOfSeen: index + 2,
        lastSeenAt: 1234,
        nextSeeingAt: new Date(5678),
      })
    );
    await seedLocalDeck(deck, cards);
    startStudy(deck.id, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }, "user-id");
    setStudySessionIndex(deck.id, 1);
    const before = savedState(deck.id);
    let router = createMemoryRouter(appRoutes, { initialEntries: ["/"] });
    let view = render(<App router={router} />);

    expect(screen.getByRole("button", { name: "Continue Local View Deck" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "View cards in Local View Deck" }));
    expect(await screen.findByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    expect(screen.getByRole("slider", { name: "Viewing progress" })).toHaveAttribute("aria-valuetext", "1 of 3");

    await userEvent.click(screen.getByRole("button", { name: "Card front" }));
    expect(screen.getByRole("region", { name: "Card answer" })).toHaveTextContent("First answer");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    await userEvent.click(screen.getByRole("button", { name: "Card front" }));
    expect(screen.getByRole("region", { name: "Card answer" })).toHaveTextContent("Second answer");
    expect(savedState(deck.id)).toEqual(before);

    const reloadPath = router.state.location.pathname;
    view.unmount();
    router.dispose();
    router = createMemoryRouter(appRoutes, { initialEntries: [reloadPath] });
    view = render(<App router={router} />);
    expect(await screen.findByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Second prompt");
    await userEvent.click(screen.getByRole("button", { name: "Back to deck list" }));
    expect(await screen.findByRole("button", { name: "Continue Local View Deck" })).toBeVisible();
    expect(savedState(deck.id)).toEqual(before);

    await userEvent.click(screen.getByRole("button", { name: "View cards in Local View Deck" }));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("First prompt");
    await userEvent.click(screen.getByRole("button", { name: "Previous card" }));
    expect(await screen.findByRole("button", { name: "Continue Local View Deck" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "View cards in Local View Deck" }));
    for (const name of ["First", "Second", "Third"]) {
      expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent(`${name} prompt`);
      await userEvent.click(screen.getByRole("button", { name: "Next card" }));
    }
    expect(await screen.findByRole("button", { name: "Continue Local View Deck" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/");
    expect(savedState(deck.id)).toEqual(before);
    view.unmount();
    router.dispose();
  });

  it("views every difficulty and tag match in standard order despite the study limit and shuffle without creating a session", async () => {
    const deck = createLocalDeck({
      id: "view-filtered",
      name: "Filtered View Deck",
      difficultyMin: 3,
      difficultyMax: 5,
      selectedTags: ["target"],
    });
    const rows = [
      { frontText: "match-1", difficulty: 5, tags: ["target"] },
      { frontText: "match-2", difficulty: 4, tags: ["target"] },
      { frontText: "match-3", difficulty: 3, tags: ["target"] },
      { frontText: "difficulty-miss", difficulty: 2, tags: ["target"] },
      { frontText: "tag-miss", difficulty: 4, tags: ["other"] },
    ];
    await seedLocalDeck(
      deck,
      rows.map((row) => createLocalCard({ id: row.frontText, deckId: deck.id, uniqueKey: row.frontText, ...row }))
    );
    updatePreferences(
      createPreferences({ loadSample: false, language: "en", maxNumberOfCardsToLearn: 2, shuffled: true })
    );
    const before = savedState(deck.id);
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/"] });
    const view = render(<App router={router} />);

    expect(screen.getByRole("button", { name: "Study Filtered View Deck" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "View cards in Filtered View Deck" }));
    for (const [index, prompt] of ["match-1", "match-2", "match-3"].entries()) {
      expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent(prompt);
      expect(screen.getByRole("slider", { name: "Viewing progress" })).toHaveAttribute(
        "aria-valuetext",
        `${String(index + 1)} of 3`
      );
      expect(screen.queryByText("difficulty-miss")).not.toBeInTheDocument();
      expect(screen.queryByText("tag-miss")).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Next card" }));
    }
    expect(await screen.findByRole("button", { name: "Study Filtered View Deck" })).toBeVisible();
    expect(getStudySession(deck.id)).toBeUndefined();
    expect(savedState(deck.id)).toEqual(before);
    view.unmount();
    router.dispose();
  });

  it("opens the intended local deck from a direct encoded View URL without writing saved data", async () => {
    const deck = createLocalDeck({ id: "view?draft=1#chapter", name: "Encoded View Deck" });
    await seedLocalDeck(deck, [
      createLocalCard({ id: "encoded-card", deckId: deck.id, frontText: "Encoded prompt", uniqueKey: "encoded" }),
    ]);
    const before = savedState(deck.id);
    const path = "/deck/view%3Fdraft%3D1%23chapter/view";
    const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
    const view = render(<App router={router} />);

    expect(await screen.findByRole("button", { name: "Card front" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Encoded prompt");
    expect(router.state.location).toMatchObject({ pathname: path, search: "", hash: "" });
    expect(savedState(deck.id)).toEqual(before);
    view.unmount();
    router.dispose();
  });

  it("persists explicit shared display changes while preserving the saved study resume point", async () => {
    const deck = createLocalDeck({ id: "shared-controls", name: "Shared controls" });
    const cards = [createLocalCard({ id: "shared-card", deckId: deck.id, frontText: "Shared prompt" })];
    await seedLocalDeck(deck, cards);
    startStudy(deck.id, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }, "user-id");
    const before = savedState(deck.id);
    let router = createMemoryRouter(appRoutes, { initialEntries: [`/deck/${deck.id}/view`] });
    let view = render(<App router={router} />);
    await userEvent.click(screen.getByRole("button", { name: "Open card actions" }));
    await userEvent.click(screen.getByRole("button", { name: "Card details" }));
    expect(getPreferences().controls.showCardDetails).toBe(false);
    const after = savedState(deck.id);
    expect({
      ...after,
      preferences: before.preferences,
      persisted: { ...after.persisted, preferences: before.persisted.preferences },
    }).toEqual(before);
    expect(JSON.parse(localStorage.getItem("tango-config") ?? "{}").state.preferences.controls.showCardDetails).toBe(
      false
    );
    view.unmount();
    router.dispose();
    router = createMemoryRouter(appRoutes, { initialEntries: [`/deck/${deck.id}/study`] });
    view = render(<App router={router} />);
    await userEvent.click(screen.getByRole("button", { name: "Open card actions" }));
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("aria-pressed", "false");
    view.unmount();
    router.dispose();
  });

  it("does not persist local viewing playback or bidirectional slider movement", async () => {
    const deck = createLocalDeck({ id: "playback-local", name: "Playback" });
    const cards = ["One", "Two", "Three"].map((name) =>
      createLocalCard({ id: name, deckId: deck.id, frontText: name, uniqueKey: name })
    );
    await seedLocalDeck(deck, cards);
    updatePreferences({ study: { cardInterval: 1, defaultAutoPlay: true } });
    startStudy(deck.id, cards, { shuffled: false, maxNumberOfCardsToLearn: 0 }, "user-id");
    setStudySessionIndex(deck.id, 1);
    const before = savedState(deck.id);
    vi.useFakeTimers();
    const router = createMemoryRouter(appRoutes, { initialEntries: [`/deck/${deck.id}/view`] });
    const view = render(<App router={router} />);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("One");
    fireEvent.change(screen.getByRole("slider", { name: "Viewing progress" }), { target: { value: "2" } });
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Three");
    fireEvent.change(screen.getByRole("slider", { name: "Viewing progress" }), { target: { value: "0" } });
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("One");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("button", { name: "Card front" })).toHaveTextContent("Two");
    expect(savedState(deck.id)).toEqual(before);
    view.unmount();
    router.dispose();
    act(() => vi.advanceTimersByTime(2000));
    expect(savedState(deck.id)).toEqual(before);
  });
});
