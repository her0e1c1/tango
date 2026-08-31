import type { Preferences } from "@/entities/preference";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { clearRemoteCards, deleteCard, mutateCards, type RemoteCardReadResult } from "@/entities/card";
import { createDeck, type Deck } from "@/entities/deck";
import { clearStudySessions, getStudySession, setStudySessionIndex, startStudy } from "@/entities/study-session";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import {
  createCard as createRemoteCard,
  createDeck as createRemoteDeck,
  createLocalCard,
  createLocalDeck,
  createPreferences,
} from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  editStudyProgress: vi.fn(),
  deckOverride: undefined as Deck | undefined,
  fetchRemoteCardRead: vi.fn(),
  localCardsHydrated: true,
  removeStudySession: vi.fn(),
  setDarkMode: vi.fn(),
  touchStudySession: vi.fn(),
  toggleShowCardDetails: vi.fn(),
  toggleShowHelp: vi.fn(),
  toggleShowPlaybackControls: vi.fn(),
  toggleShowSwipeButtonList: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/card", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...original,
    fetchRemoteCardRead: mocks.fetchRemoteCardRead,
    useLocalCardsHydrated: () => mocks.localCardsHydrated,
  };
});
vi.mock("@/entities/deck", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...original,
    useDeck: (id: string) => {
      const deck = original.useDeck(id);
      return mocks.deckOverride ?? deck;
    },
  };
});
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
  toggleShowCardDetails: mocks.toggleShowCardDetails,
  toggleShowHelp: mocks.toggleShowHelp,
  toggleShowPlaybackControls: mocks.toggleShowPlaybackControls,
  toggleShowSwipeButtonList: mocks.toggleShowSwipeButtonList,
}));
vi.mock("@/entities/study-session", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/study-session")>();
  return {
    ...original,
    removeStudySession: (...args: Parameters<typeof original.removeStudySession>) => {
      mocks.removeStudySession(...args);
      original.removeStudySession(...args);
    },
    touchStudySession: (...args: Parameters<typeof original.touchStudySession>) => {
      mocks.touchStudySession(...args);
      original.touchStudySession(...args);
    },
  };
});
// Persistence is outside Page behavior; successful writes let the real study workflow advance.
vi.mock("@/entities/study-progress", () => ({ editStudyProgress: mocks.editStudyProgress }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { StudySessionPage } from "./StudySessionPage";

const DeckListDestination = () => {
  const navigate = useNavigate();
  return (
    <>
      <h1>Deck list destination</h1>
      <button type="button" onClick={() => void navigate(-1)}>
        Browser back
      </button>
    </>
  );
};

describe("SWIPE-01 SWIPE-08 SWIPE-10 SWIPE-24 SWIPE-27 SWIPE-28 SWIPE-29 StudySessionPage", () => {
  const deckId = "deck-id";
  const deck = createLocalDeck({ id: deckId, name: "Study deck", category: "raw" });
  const firstCard = createLocalCard({
    id: "first-card",
    deckId,
    frontText: "Front one",
    backText: "Back one",
    uniqueKey: "first-card",
    score: 2,
    numberOfSeen: 3,
  });
  const secondCard = createLocalCard({
    id: "second-card",
    deckId,
    frontText: "Front two",
    backText: "Back two",
    uniqueKey: "second-card",
    score: 1,
    numberOfSeen: 4,
  });
  const renderPage = (path = `/deck/${deckId}/study`, previousPath?: string) => {
    const initialEntries = previousPath === undefined ? [path] : [previousPath, path];
    return render(
      <>
        <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
          <Routes>
            <Route path="/" element={<DeckListDestination />} />
            <Route path="/previous" element={<h1>Previous destination</h1>} />
            <Route path="/deck/:id/start" element={<h1>Study setup destination</h1>} />
            <Route path="/deck/:id/study" element={<StudySessionPage />} />
          </Routes>
        </MemoryRouter>
        <ToastViewport />
      </>
    );
  };
  const openStudyActions = () => {
    fireEvent.click(screen.getByRole("button", { name: "Open study actions" }));
    return screen.getByRole("group", { name: "Study actions" });
  };

  beforeEach(async () => {
    document.documentElement.lang = "en";
    clearStudySessions();
    clearRemoteCards();
    mocks.deckOverride = undefined;
    dismissToast();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.editStudyProgress.mockReset().mockResolvedValue(undefined);
    mocks.fetchRemoteCardRead.mockReset();
    mocks.localCardsHydrated = true;
    mocks.removeStudySession.mockReset();
    mocks.setDarkMode.mockReset();
    mocks.touchStudySession.mockReset();
    mocks.toggleShowCardDetails.mockReset();
    mocks.toggleShowHelp.mockReset();
    mocks.toggleShowPlaybackControls.mockReset();
    mocks.toggleShowSwipeButtonList.mockReset();
    await createDeck("", deck);
    await mutateCards("", [
      { kind: "create", card: firstCard },
      { kind: "create", card: secondCard },
    ]);
    startStudy(deckId, [firstCard, secondCard], mocks.preferences.study);
  });

  it("renders the active session from stored Entity state", () => {
    renderPage();

    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open study actions" })).toBeVisible();
    expect(screen.queryByRole("group", { name: "Study actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to deck list" })).toBeVisible();
    expect(screen.getByText("Front one")).toBeVisible();
    expect(screen.getByText(/3 times/)).toBeVisible();
  });

  it("reveals the current answer from the Enter shortcut", () => {
    renderPage();

    fireEvent.keyDown(window, { key: "Enter" });

    expect(screen.getByText("Back one")).toBeVisible();
    expect(screen.queryByText("Front one")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Score 2, positive")).not.toBeInTheDocument();
    expect(screen.queryByText(/3 times/)).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Study actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to deck list" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe controls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Playback controls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("ignores directional shortcuts while showing the answer", async () => {
    mocks.preferences = createPreferences({
      controls: {
        cardSwipeUp: "GoToNextCard",
        cardSwipeDown: "GoToNextCard",
        cardSwipeLeft: "GoToNextCard",
        cardSwipeRight: "GoToNextCard",
      },
    });
    const user = userEvent.setup();
    renderPage();
    await user.keyboard("{Enter}");

    await user.keyboard("{ArrowUp}{ArrowDown}{ArrowLeft}{ArrowRight}");

    expect(screen.getByText("Back one")).toBeVisible();
    expect(mocks.editStudyProgress).not.toHaveBeenCalled();
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
  });

  it("runs a configured back-text edge action and shows the next card front", async () => {
    mocks.preferences = createPreferences({
      controls: {
        showBackTextSwipeOverlays: true,
        cardSwipeLeft: "GoToNextCardMastered",
      },
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Front one" }));

    await user.click(screen.getByRole("button", { name: "Swipe left" }));

    await waitFor(() => expect(screen.getByText("Front two")).toBeVisible());
    expect(screen.queryByText("Back two")).not.toBeInTheDocument();
    expect(mocks.editStudyProgress).toHaveBeenCalledExactlyOnceWith(
      "user-id",
      expect.objectContaining({ cardId: "first-card", score: 3, numberOfSeen: 4 }),
      { persistence: "local", cardId: "first-card" }
    );
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });

  it("keeps Space native while the answer scrolling surface is focused", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.keyboard("{Enter}");
    const answerSurface = screen.getByRole("region", { name: "Study answer" });
    answerSurface.focus();

    await user.keyboard(" ");
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
  });

  it("keeps the ArrowRight shortcut active while the front card is focused", async () => {
    const user = userEvent.setup();
    renderPage();

    const front = screen.getByRole("button", { name: "Front one" });
    front.focus();
    await user.keyboard("{ArrowRight}");

    await waitFor(() => expect(screen.getByText("Front two")).toBeVisible());
    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();
    expect(screen.queryByText("Front one")).not.toBeInTheDocument();
  });

  it("shows successful swipe feedback through the shared Toast viewport", async () => {
    mocks.preferences = createPreferences({
      appearance: { darkMode: false, showSwipeFeedback: true },
      cardSwipeRight: "GoToNextCardMastered",
    });
    const user = userEvent.setup();
    renderPage();

    await user.keyboard("{ArrowRight}");

    await waitFor(() => expect(screen.getByText("Front two")).toBeVisible());
    expect(screen.getByText("Swiped right")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
  });

  it("shows configured Help rows without letting dialog keys change Study state", () => {
    mocks.preferences = createPreferences({
      controls: {
        cardSwipeUp: "GoBack",
        cardSwipeDown: "DoNothing",
        cardSwipeLeft: "GoToNextCardToggleMastered",
        cardSwipeRight: "GoToPrevCard",
      },
    });
    clearStudySessions();
    startStudy(deckId, [firstCard, secondCard], mocks.preferences.study);
    renderPage();
    const sessionBeforeHelp = getStudySession(deckId);

    const trigger = screen.getByRole("button", { name: "Open study help" });
    fireEvent.click(trigger);
    expect(trigger).not.toHaveFocus();

    const dialog = screen.getByRole("dialog", { name: "Study controls" });
    expect(dialog).toHaveTextContent("Arrow Up / Swipe UpEnd the current session and return to the deck list");
    expect(dialog).toHaveTextContent("Arrow Down / Swipe DownNo action");
    expect(dialog).toHaveTextContent("Arrow Left / Swipe LeftToggle mastered and go to the next card");
    expect(dialog).toHaveTextContent("Enter / Select CardFlip or reveal the current card");
    expect(dialog).toHaveTextContent("Space / Play or Pause buttonPlay or pause autoplay");
    expect(dialog).toHaveTextContent("B / Swipe controls buttonHide the currently visible swipe buttons");
    expect(dialog).toHaveTextContent("Card details buttonShow or hide score and study history");
    expect(dialog).toHaveTextContent("Back to deck list buttonExit without ending the current study session");
    expect(screen.getByRole("button", { name: "Close help" })).toHaveFocus();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "b" });
    fireEvent.keyDown(window, { key: " " });

    expect(screen.getByText("Front one")).toBeVisible();
    expect(getStudySession(deckId)).toEqual(sessionBeforeHelp);
    expect(mocks.editStudyProgress).not.toHaveBeenCalled();
    expect(mocks.toggleShowSwipeButtonList).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole("button", { name: "Close help" }), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("uses the current document locale for semantic Help labels", () => {
    document.documentElement.lang = "ja-JP";
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "学習ヘルプを開く" }));

    expect(screen.getByRole("dialog", { name: "学習画面の操作" })).toHaveTextContent(
      "上矢印 / 上へスワイプ習得済みにして次のカードへ移動"
    );
  });

  it("pauses autoplay while Help is open and resumes without changing its explicit state", () => {
    mocks.preferences = createPreferences({ defaultAutoPlay: true, cardInterval: 1 });
    clearStudySessions();
    startStudy(deckId, [firstCard, secondCard], mocks.preferences.study);
    vi.useFakeTimers();

    try {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "Open study help" }));

      act(() => vi.advanceTimersByTime(1000));

      expect(screen.getByText("Front one")).toBeVisible();
      expect(screen.getByRole("button", { name: "Pause" })).toBePressed();

      fireEvent.click(screen.getByRole("button", { name: "Close help" }));
      act(() => vi.advanceTimersByTime(1000));

      expect(screen.getByText("Front two")).toBeVisible();
      expect(screen.getByRole("button", { name: "Pause" })).toBePressed();
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns from a deep-linked Study to the Deck list without changing the resumable session", () => {
    renderPage();
    const sessionBeforeExit = getStudySession(deckId);
    openStudyActions();

    fireEvent.click(screen.getByRole("button", { name: "Back to deck list" }));

    expect(screen.getByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();
    expect(getStudySession(deckId)).toEqual(sessionBeforeExit);
    expect(mocks.removeStudySession).not.toHaveBeenCalled();
  });

  it("keeps the completion screen on the Study route and disables Study shortcuts", async () => {
    setStudySessionIndex(deckId, 1);
    renderPage(`/deck/${deckId}/study`, "/previous");

    fireEvent.click(screen.getByRole("button", { name: "Swipe up" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Study complete" })).toBeVisible();
    expect(screen.getByText("You studied 2 cards.")).toBeVisible();
    expect(screen.queryByRole("heading", { level: 1, name: "Deck list destination" })).not.toBeInTheDocument();
    expect(getStudySession(deckId)).toBeUndefined();

    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(mocks.editStudyProgress).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Back to deck list" }));
    expect(screen.getByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Browser back" }));
    expect(screen.getByRole("heading", { level: 1, name: "Previous destination" })).toBeVisible();
    expect(screen.queryByRole("heading", { level: 1, name: "Study complete" })).not.toBeInTheDocument();
  });

  it("keeps study actions available while the Header stays hidden", () => {
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });

    renderPage();
    const actions = openStudyActions();

    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(actions).toBeVisible();
    expect(screen.getByRole("button", { name: "Back to deck list" })).toBeVisible();
    expect(screen.getByLabelText("Score 2, positive")).toBeVisible();
    expect(screen.getByText(/3 times/)).toBeVisible();
  });

  it("delegates visibility toggles to persisted preference actions", () => {
    renderPage();
    openStudyActions();

    fireEvent.click(screen.getByRole("button", { name: "Help button" }));
    fireEvent.click(screen.getByRole("button", { name: "Swipe controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Playback controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Card details" }));

    expect(mocks.toggleShowHelp).toHaveBeenCalledOnce();
    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();
    expect(mocks.toggleShowPlaybackControls).toHaveBeenCalledOnce();
    expect(mocks.toggleShowCardDetails).toHaveBeenCalledOnce();
  });

  it.each([
    ["swipe", "Swipe controls", "{Enter}"],
    ["swipe", "Swipe controls", " "],
    ["playback", "Playback controls", "{Enter}"],
    ["playback", "Playback controls", " "],
  ] as const)("uses %s visibility with %s without running a Study shortcut", async (control, label, key) => {
    const user = userEvent.setup();
    renderPage();
    openStudyActions();

    screen.getByRole("button", { name: label }).focus();
    await user.keyboard(key);

    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledTimes(control === "swipe" ? 1 : 0);
    expect(mocks.toggleShowPlaybackControls).toHaveBeenCalledTimes(control === "playback" ? 1 : 0);
    expect(screen.queryByText("Back one")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
  });

  it("keeps the swipe visibility shortcut active while a toolbar button is focused", async () => {
    const user = userEvent.setup();
    renderPage();
    openStudyActions();

    const swipeToggle = screen.getByRole("button", { name: "Swipe controls" });
    swipeToggle.focus();
    await user.keyboard("b");

    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();
    expect(mocks.editStudyProgress).not.toHaveBeenCalled();
  });

  it.each(["{ArrowUp}", "{ArrowDown}", "{ArrowLeft}", "{ArrowRight}"])(
    "keeps %s native to the focused progress slider",
    async (key) => {
      mocks.preferences = createPreferences({
        controls: {
          cardSwipeUp: "GoToNextCard",
          cardSwipeDown: "GoToNextCard",
          cardSwipeLeft: "GoToNextCard",
          cardSwipeRight: "GoToNextCard",
        },
      });
      const user = userEvent.setup();
      renderPage();

      const progress = screen.getByRole("slider", { name: "Study progress" });
      progress.focus();
      await user.keyboard(key);

      expect(mocks.editStudyProgress).not.toHaveBeenCalled();
    }
  );

  it("renders the selected visibility combination", () => {
    mocks.preferences = createPreferences({
      controls: { showCardDetails: false, showSwipeButtonList: false, showPlaybackControls: false },
    });

    renderPage();
    openStudyActions();

    expect(screen.getByRole("button", { name: "Swipe controls" })).not.toBePressed();
    expect(screen.getByRole("button", { name: "Playback controls" })).not.toBePressed();
    expect(screen.getByRole("button", { name: "Card details" })).not.toBePressed();
    expect(screen.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Score 2, positive")).not.toBeInTheDocument();
    expect(screen.queryByText(/3 times/)).not.toBeInTheDocument();
  });

  it("disables playback visibility when the card interval is zero", () => {
    mocks.preferences = createPreferences({ cardInterval: 0 });

    renderPage();
    openStudyActions();

    const playbackToggle = screen.getByRole("button", { name: "Playback controls" });
    expect(playbackToggle).toHaveAttribute("aria-disabled", "true");
    expect(playbackToggle).not.toBeDisabled();
    expect(playbackToggle).toHaveAccessibleDescription(
      "Playback controls unavailable because the card interval is set to 0"
    );
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("keeps a local-missing reason visible until explicit recovery returns to Study setup", async () => {
    await deleteCard("", firstCard);
    await deleteCard("", secondCard);
    clearStudySessions();
    startStudy(deckId, [firstCard], mocks.preferences.study);
    const unavailableSession = getStudySession(deckId);

    renderPage();

    expect(screen.getByRole("heading", { name: "This local study card is missing." })).toBeVisible();
    expect(screen.getByText(/no longer stored on this device/i)).toBeVisible();
    expect(getStudySession(deckId)).toEqual(unavailableSession);
    const recovery = screen.getByRole("button", { name: "Back to study setup" });
    expect(recovery).toHaveFocus();

    fireEvent.click(recovery);

    expect(screen.getByRole("heading", { name: "Study setup destination" })).toBeVisible();
    expect(getStudySession(deckId)).toBeUndefined();
  });

  it("keeps a structurally invalid session reason visible until the user chooses a destination", () => {
    clearStudySessions();
    renderPage();

    expect(screen.getByRole("heading", { name: "This study session can’t be resumed." })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Deck list destination" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to study setup" }));
    expect(screen.getByRole("heading", { name: "Study setup destination" })).toBeVisible();
  });

  it("shows route feedback when the Deck Entity is unavailable", () => {
    renderPage("/deck/missing-deck/study");

    expect(screen.getByRole("heading", { name: "Study deck unavailable." })).toBeVisible();
    expect(screen.getByRole("button", { name: "Back to deck list" })).toHaveFocus();
    expect(mocks.removeStudySession).not.toHaveBeenCalled();
    expect(mocks.touchStudySession).not.toHaveBeenCalled();
  });

  it("keeps the verifying screen resumable and offers Exit without a duplicate Retry", () => {
    const remoteDeck = createRemoteDeck({ id: deckId, name: "Remote study deck" });
    const remoteCard = createRemoteCard({ id: "remote-card", deckId, frontText: "Remote front" });
    mocks.deckOverride = remoteDeck;
    clearStudySessions();
    startStudy(deckId, [remoteCard], mocks.preferences.study);
    const sessionBeforeExit = getStudySession(deckId);
    mocks.fetchRemoteCardRead.mockReturnValue(new Promise<RemoteCardReadResult>(() => undefined));

    renderPage();

    expect(screen.getByRole("heading", { name: "Verifying study session…" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(getStudySession(deckId)).toEqual(sessionBeforeExit);

    fireEvent.click(screen.getByRole("button", { name: "Exit" }));
    expect(screen.getByRole("heading", { name: "Deck list destination" })).toBeVisible();
    expect(getStudySession(deckId)).toEqual(sessionBeforeExit);
  });

  it.each([
    [{ status: "missing" } as const, "This study card is unavailable.", /could not be found/i],
    [{ status: "tombstoned" } as const, "This study card was deleted.", /available cards/i],
  ])("keeps confirmed remote %s feedback visible until explicit recovery", async (result, title, description) => {
    const remoteDeck = createRemoteDeck({ id: deckId, name: "Remote study deck" });
    const remoteCard = createRemoteCard({ id: "remote-card", deckId, frontText: "Remote front" });
    mocks.deckOverride = remoteDeck;
    clearStudySessions();
    startStudy(deckId, [remoteCard], mocks.preferences.study);
    const unavailableSession = getStudySession(deckId);
    mocks.fetchRemoteCardRead.mockResolvedValue(result);

    renderPage();

    expect(await screen.findByRole("heading", { name: title })).toBeVisible();
    expect(screen.getByText(description)).toBeVisible();
    expect(getStudySession(deckId)).toEqual(unavailableSession);
    const recovery = screen.getByRole("button", { name: "Back to study setup" });
    expect(recovery).toHaveFocus();

    fireEvent.click(recovery);
    expect(screen.getByRole("heading", { name: "Study setup destination" })).toBeVisible();
    expect(getStudySession(deckId)).toBeUndefined();
  });

  it("disables duplicate Retry and restores focus to the same Card without losing session position", async () => {
    const remoteDeck = createRemoteDeck({ id: deckId, name: "Remote study deck" });
    const remoteCard = createRemoteCard({
      id: "remote-card",
      deckId,
      frontText: "Recovered remote front",
      score: 4,
      numberOfSeen: 5,
    });
    mocks.deckOverride = remoteDeck;
    clearStudySessions();
    startStudy(deckId, [remoteCard], mocks.preferences.study);
    const sessionBeforeRetry = getStudySession(deckId);
    mocks.fetchRemoteCardRead.mockRejectedValueOnce(new Error("temporary verification failure"));

    renderPage();

    expect(await screen.findByRole("heading", { name: "We couldn’t verify this study card." })).toBeVisible();
    const readyRetry = screen.getByRole("button", { name: "Retry" });
    expect(readyRetry).toHaveFocus();
    expect(getStudySession(deckId)).toEqual(sessionBeforeRetry);

    let resolveRetry: ((result: RemoteCardReadResult) => void) | undefined;
    mocks.fetchRemoteCardRead.mockImplementationOnce(
      () =>
        new Promise<RemoteCardReadResult>((resolve) => {
          resolveRetry = resolve;
        })
    );
    fireEvent.click(readyRetry);

    const pendingRetry = screen.getByRole("button", { name: "Retry" });
    expect(pendingRetry).toBeDisabled();
    expect(pendingRetry).toHaveAttribute("aria-busy", "true");
    fireEvent.click(pendingRetry);
    expect(mocks.fetchRemoteCardRead).toHaveBeenCalledTimes(2);
    expect(getStudySession(deckId)).toEqual(sessionBeforeRetry);

    act(() => {
      resolveRetry?.({
        status: "active",
        read: {
          card: remoteCard,
          progress: { cardId: remoteCard.id, score: remoteCard.score, numberOfSeen: remoteCard.numberOfSeen },
        },
      });
    });

    const recoveredCard = await screen.findByRole("button", { name: "Recovered remote front" });
    expect(recoveredCard).toHaveFocus();
    expect(getStudySession(deckId)).toMatchObject({
      sessionId: sessionBeforeRetry?.sessionId,
      cardOrderIds: sessionBeforeRetry?.cardOrderIds,
      currentIndex: sessionBeforeRetry?.currentIndex,
    });
  });

  it("rejects a route without a deck id", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <StudySessionPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid deck id");
  });
});
