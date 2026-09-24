import "@/test/mockFirestorePersistence";
import { setStudySessionIndex } from "@/entities/study-session";
import { Timestamp } from "firebase/firestore";
import type { Preferences } from "@/entities/preference";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getI18n } from "react-i18next";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { replaceAuthSession } from "@/entities/auth";
import { deleteCard, mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { clearStudySessions, getStudySession, subscribeStudySessions } from "@/entities/study-session";
import { startStudy } from "@/test/entityFixtures";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  receiveSnapshot: undefined as
    | ((snapshot: {
        docChanges: () => {
          type: "added";
          doc: { id: string; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } };
        }[];
        metadata: { fromCache: boolean; hasPendingWrites: boolean };
      }) => void)
    | undefined,
  preferences: null as unknown as Preferences,
  persistOperation: vi.fn(),
  abandonStudySession: vi.fn(),
  setDarkMode: vi.fn(),
  touchStudySession: vi.fn(),
  toggleViewMode: vi.fn(),
  toggleShowCardDetails: vi.fn(),
  toggleShowViewMode: vi.fn(),
  toggleShowHelp: vi.fn(),
  toggleShowPlaybackControls: vi.fn(),
  toggleShowSkip: vi.fn(),
  toggleShowSwipeButtonList: vi.fn(),
}));

vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/firestore")>()),
  collection: vi.fn(),
  where: vi.fn(),
  query: vi.fn(),
  onSnapshot: (_query: unknown, _options: unknown, receive: typeof mocks.receiveSnapshot) => {
    mocks.receiveSnapshot = receive;
    return () => {
      mocks.receiveSnapshot = undefined;
    };
  },
}));

vi.mock("@/entities/preference", () => ({
  toggleViewMode: mocks.toggleViewMode,
  usePreferences: () => mocks.preferences,
  getPreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
  toggleShowCardDetails: mocks.toggleShowCardDetails,
  toggleShowViewMode: mocks.toggleShowViewMode,
  toggleShowHelp: mocks.toggleShowHelp,
  toggleShowPlaybackControls: mocks.toggleShowPlaybackControls,
  toggleShowSkip: mocks.toggleShowSkip,
  toggleShowSwipeButtonList: mocks.toggleShowSwipeButtonList,
}));
vi.mock("@/entities/study-session", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/study-session")>();
  return {
    ...original,
    abandonStudySession: (...args: Parameters<typeof original.abandonStudySession>) => {
      mocks.abandonStudySession(...args);
      return original.abandonStudySession(...args);
    },
    touchStudySession: (...args: Parameters<typeof original.touchStudySession>) => {
      mocks.touchStudySession(...args);
      return original.touchStudySession(...args);
    },
  };
});
// Persistence is outside Page behavior; successful writes let the real study workflow advance.

vi.mock("@/shared/firebase", () => ({ auth: {}, db: { app: { options: { projectId: "unit-study" } } } }));

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

describe("StudySessionPage [STUDY-CONTROLS-07] [STUDY-ACTIONS-04] [STUDY-SESSION-03] [SETTINGS-04] [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-SESSION-05] [STUDY-CONTROLS-04]", () => {
  const deckId = "deck-id";
  const deck = createLocalDeck({ id: deckId, name: "Study deck", category: "raw" });
  const firstCard = createLocalCard({
    id: "first-card",
    deckId,
    frontText: "Front one",
    backText: "Back one",
    uniqueKey: "first-card",
  });
  const secondCard = createLocalCard({
    id: "second-card",
    deckId,
    frontText: "Front two",
    backText: "Back two",
    uniqueKey: "second-card",
  });
  const renderPage = (path = `/deck/${deckId}/study`, previousPath?: string) => {
    const initialEntries = previousPath === undefined ? [path] : [previousPath, path];
    return render(
      <>
        <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
          <Routes>
            <Route path="/" element={<DeckListDestination />} />
            <Route path="/previous" element={<h1>Previous destination</h1>} />
            <Route path="/deck/:id/study" element={<StudySessionPage />} />
          </Routes>
        </MemoryRouter>
        <ToastViewport />
      </>
    );
  };
  const openStudyActions = () => {
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));
    return screen.getByRole("group", { name: "Card actions" });
  };

  beforeEach(async () => {
    document.documentElement.lang = "en";
    replaceAuthSession({ status: "authenticated", uid: "user-id", isAnonymous: false, displayName: null });
    clearStudySessions();
    dismissToast();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.persistOperation.mockReset().mockResolvedValue(undefined);
    mocks.abandonStudySession.mockReset();
    mocks.setDarkMode.mockReset();
    mocks.touchStudySession.mockReset();
    mocks.toggleViewMode.mockReset();
    mocks.toggleShowCardDetails.mockReset();
    mocks.toggleShowHelp.mockReset();
    mocks.toggleShowPlaybackControls.mockReset();
    mocks.toggleShowSkip.mockReset();
    mocks.toggleShowSwipeButtonList.mockReset();
    await createDeck("user-id", deck);
    await mutateCards("user-id", [
      { kind: "create", card: firstCard },
      { kind: "create", card: secondCard },
    ]);
    startStudy(deckId, [firstCard, secondCard], mocks.preferences.study, "user-id");
  });

  it("exits view mode once for a held Enter without revealing the answer", () => {
    mocks.preferences.controls.viewMode = true;
    mocks.toggleViewMode.mockImplementation(() => {
      mocks.preferences.controls.viewMode = false;
    });
    renderPage();
    const surface = screen.getByRole("region", { name: "Card front text" });
    fireEvent.keyDown(surface, { key: "Enter" });
    fireEvent.keyDown(surface, { key: "Enter", repeat: true });
    fireEvent.keyDown(window, { key: "Enter", repeat: true });
    expect(mocks.toggleViewMode).toHaveBeenCalledOnce();
    expect(screen.getByText("Front one")).toBeVisible();
    expect(screen.queryByText("Back one")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByText("Back one")).toBeVisible();
  });

  it("renders the active session from stored Entity state", () => {
    renderPage();

    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open card actions" })).toBeVisible();
    expect(screen.queryByRole("group", { name: "Card actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to deck list" })).toBeVisible();
    expect(screen.getByText("Front one")).toBeVisible();
    expect(screen.getByText("not studied yet")).toBeVisible();
  });

  it("shows four ratings and prevents backward slider movement", () => {
    setStudySessionIndex(deckId, 1);
    renderPage();
    expect(screen.getByText("Again")).toBeVisible();
    expect(screen.getByText("Hard")).toBeVisible();
    expect(screen.getByText("Good")).toBeVisible();
    expect(screen.getByText("Easy")).toBeVisible();
    const slider = screen.getByRole("slider", { name: "Study progress" });
    fireEvent.change(slider, { target: { value: "0" } });
    expect(slider).toHaveValue("1");
    expect(screen.getByText("Front two")).toBeVisible();
    expect(mocks.persistOperation).not.toHaveBeenCalled();
  });

  it("allows the progress slider to advance and prevents returning to the skipped Card", async () => {
    renderPage();
    const slider = screen.getByRole("slider", { name: "Study progress" });
    fireEvent.change(slider, { target: { value: "1" } });

    expect(await screen.findByText("Front two")).toBeVisible();
    expect(slider).toHaveValue("1");
    expect(getStudySession(deckId)?.currentIndex).toBe(1);

    fireEvent.change(slider, { target: { value: "0" } });
    expect(screen.getByText("Front two")).toBeVisible();
    expect(slider).toHaveValue("1");
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.persistOperation).not.toHaveBeenCalled();
  });

  it.each([false, true])("reveals the answer from Enter with anonymous=%s", (isAnonymous) => {
    replaceAuthSession({ status: "authenticated", uid: "user-id", isAnonymous, displayName: null });
    renderPage();

    fireEvent.keyDown(window, { key: "Enter" });

    expect(screen.getByText("Back one")).toBeVisible();
    expect(screen.queryByText("Front one")).not.toBeInTheDocument();
    expect(screen.queryByText("not studied yet")).not.toBeInTheDocument();
    expect(screen.queryByText(/3 times/)).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Card actions" })).not.toBeInTheDocument();
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
    expect(mocks.persistOperation).not.toHaveBeenCalled();
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
  });

  it("runs a configured back-text edge action and shows the next card front", async () => {
    mocks.preferences = createPreferences({
      controls: {
        showBackTextSwipeOverlays: true,
        cardSwipeLeft: "RateGood",
      },
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Front one" }));

    await user.click(screen.getByRole("button", { name: "Swipe left" }));

    await waitFor(() => expect(screen.getByText("Front two")).toBeVisible());
    expect(screen.queryByText("Back two")).not.toBeInTheDocument();
    expect(mocks.persistOperation).toHaveBeenCalledExactlyOnceWith(
      "user-id",
      expect.objectContaining({ cardId: "first-card", fsrs: expect.objectContaining({ reps: 1 }) })
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
    expect(mocks.persistOperation).toHaveBeenCalledOnce();
    expect(screen.queryByText("Front one")).not.toBeInTheDocument();
  });

  it("shows successful swipe feedback through the shared Toast viewport", async () => {
    mocks.preferences = createPreferences({
      appearance: { darkMode: false, showSwipeFeedback: true },
      cardSwipeRight: "RateGood",
    });
    const user = userEvent.setup();
    renderPage();

    await user.keyboard("{ArrowRight}");

    await waitFor(() => expect(screen.getByText("Front two")).toBeVisible());
    expect(screen.getByTestId("swipe-feedback-direction")).toHaveAttribute(
      "data-swipe-feedback-direction",
      "cardSwipeRight"
    );
    expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Swiped right");
    expect(screen.getAllByText("Swiped right")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
  });

  it("uses the latest locale when persistence resolves after a language change", async () => {
    mocks.preferences = createPreferences({
      appearance: { darkMode: false, showSwipeFeedback: true },
      cardSwipeRight: "RateGood",
    });
    const request = Promise.withResolvers<void>();
    mocks.persistOperation.mockReturnValueOnce(request.promise);
    renderPage();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    act(() => {
      void getI18n().changeLanguage("ja");
    });
    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });

    expect(await screen.findByRole("status", { name: "トースト通知" })).toHaveTextContent("右へスワイプしました");
    expect(screen.getByTestId("swipe-feedback-direction")).toHaveAttribute(
      "data-swipe-feedback-direction",
      "cardSwipeRight"
    );
    expect(screen.queryByText("Swiped right")).not.toBeInTheDocument();
    expect(screen.getByText("Front two")).toBeVisible();
  });

  it("shows configured Help rows without letting dialog keys change Study state", () => {
    mocks.preferences = createPreferences({
      controls: {
        cardSwipeUp: "GoBack",
        cardSwipeDown: "DoNothing",
        cardSwipeLeft: "RateHard",
        cardSwipeRight: "RateEasy",
      },
    });
    clearStudySessions();
    startStudy(deckId, [firstCard, secondCard], mocks.preferences.study, "user-id");
    renderPage();
    const sessionBeforeHelp = getStudySession(deckId);

    const trigger = screen.getByRole("button", { name: "Open study help" });
    fireEvent.click(trigger);
    expect(trigger).not.toHaveFocus();

    const dialog = screen.getByRole("dialog", { name: "Study controls" });
    expect(dialog).toHaveTextContent("Arrow Up / Swipe UpEnd the current session and return to the deck list");
    expect(dialog).toHaveTextContent("Arrow Down / Swipe DownNo action");
    expect(dialog).toHaveTextContent("Arrow Right / Swipe RightEasy — answer and continue");
    expect(dialog).toHaveTextContent("Arrow Left / Swipe LeftHard — answer and continue");
    expect(dialog).toHaveTextContent("Enter / Select CardFlip or reveal the current card");
    expect(dialog).toHaveTextContent("Space / Play or Pause buttonPlay or pause autoplay");
    expect(dialog).toHaveTextContent("B / Swipe controls buttonHide the currently visible swipe buttons");
    expect(dialog).toHaveTextContent("Card details buttonShow or hide FSRS difficulty and last review");
    expect(dialog).toHaveTextContent("Back to deck list buttonExit without ending the current study session");
    expect(screen.getByRole("button", { name: "Close help" })).toHaveFocus();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "b" });
    fireEvent.keyDown(window, { key: " " });

    expect(screen.getByText("Front one")).toBeVisible();
    expect(getStudySession(deckId)).toEqual(sessionBeforeHelp);
    expect(mocks.persistOperation).not.toHaveBeenCalled();
    expect(mocks.toggleShowSwipeButtonList).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole("button", { name: "Close help" }), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("updates semantic Help labels without resetting the mounted session or controls", () => {
    mocks.preferences = createPreferences({ defaultAutoPlay: true, cardInterval: 60 });
    clearStudySessions();
    startStudy(deckId, [firstCard, secondCard], mocks.preferences.study, "user-id");
    renderPage();
    const sessionBeforeLanguageChange = getStudySession(deckId);
    const cardBeforeLanguageChange = screen.getByText("Front one");
    const autoPlayBeforeLanguageChange = screen.getByRole("button", { name: "Pause" });

    fireEvent.click(screen.getByRole("button", { name: "Open study help" }));
    const dialogBeforeLanguageChange = screen.getByRole("dialog", { name: "Study controls" });

    act(() => {
      void getI18n().changeLanguage("ja");
    });

    const localizedDialog = screen.getByRole("dialog", { name: "学習画面の操作" });
    expect(localizedDialog).toBe(dialogBeforeLanguageChange);
    expect(localizedDialog).toHaveTextContent("上矢印 / 上へスワイプEasy（簡単）で回答して次へ");
    expect(screen.getByRole("button", { name: "一時停止" })).toBe(autoPlayBeforeLanguageChange);
    expect(screen.getByText("Front one")).toBe(cardBeforeLanguageChange);
    expect(getStudySession(deckId)).toEqual(sessionBeforeLanguageChange);
  });

  it("pauses autoplay while Help is open and resumes without changing its explicit state", async () => {
    mocks.preferences = createPreferences({ defaultAutoPlay: true, cardInterval: 1 });
    clearStudySessions();
    startStudy(deckId, [firstCard, secondCard], mocks.preferences.study, "user-id");
    vi.useFakeTimers();

    try {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "Open study help" }));

      await actAsync(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByText("Front one")).toBeVisible();
      expect(screen.getByRole("button", { name: "Pause" })).toBePressed();

      fireEvent.click(screen.getByRole("button", { name: "Close help" }));
      await actAsync(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

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
    expect(mocks.abandonStudySession).not.toHaveBeenCalled();
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
    expect(mocks.persistOperation).toHaveBeenCalledOnce();

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
    expect(screen.getByText("not studied yet")).toBeVisible();
  });

  it("delegates visibility toggles to persisted preference actions", () => {
    renderPage();
    openStudyActions();

    fireEvent.click(screen.getByRole("button", { name: "Help button" }));
    fireEvent.click(screen.getByRole("button", { name: "Swipe controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Playback controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip control" }));
    fireEvent.click(screen.getByRole("button", { name: "Card details" }));

    expect(mocks.toggleShowHelp).toHaveBeenCalledOnce();
    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();
    expect(mocks.toggleShowPlaybackControls).toHaveBeenCalledOnce();
    expect(mocks.toggleShowSkip).toHaveBeenCalledOnce();
    expect(mocks.toggleShowCardDetails).toHaveBeenCalledOnce();
  });

  it("shows and hides the skip button from preferences", () => {
    mocks.preferences = createPreferences({ controls: { showSkip: false } });
    const { unmount } = renderPage();
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeInTheDocument();
    unmount();

    mocks.preferences = createPreferences({ controls: { showSkip: true } });
    renderPage();
    expect(screen.getByRole("button", { name: "Skip" })).toBeVisible();
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
    expect(mocks.persistOperation).not.toHaveBeenCalled();
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

      expect(mocks.persistOperation).not.toHaveBeenCalled();
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
    expect(screen.queryByText("not studied yet")).not.toBeInTheDocument();
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

  it("shows loading feedback while active session cards are unavailable", async () => {
    await deleteCard("user-id", firstCard.id);
    await deleteCard("user-id", secondCard.id);
    clearStudySessions();
    startStudy(deckId, [firstCard], mocks.preferences.study, "user-id");

    renderPage();

    expect(screen.getByRole("heading", { name: "Loading…" })).toBeVisible();
  });

  it("stays on a direct study route until the saved session arrives", async () => {
    const saved = getStudySession(deckId);
    if (saved === undefined) throw new Error("Expected a saved session");
    clearStudySessions();
    const stop = subscribeStudySessions("user-id", vi.fn());
    renderPage();
    expect(screen.getByRole("heading", { name: "Loading…" })).toBeVisible();
    await waitFor(() => expect(mocks.receiveSnapshot).toBeDefined());
    act(() =>
      mocks.receiveSnapshot?.({
        metadata: { fromCache: false, hasPendingWrites: false },
        docChanges: () => [
          {
            type: "added",
            doc: {
              metadata: { hasPendingWrites: false },
              id: saved.sessionId,
              data: () => ({
                uid: "user-id",
                deckId,
                cardOrderIds: saved.cardOrderIds,
                currentIndex: saved.currentIndex,
                startedAt: Timestamp.fromMillis(1),
                createdAt: Timestamp.fromMillis(1),
                updatedAt: Timestamp.fromMillis(1),
                lastStudiedAt: 1,
                endedAt: null,
                endReason: null,
              }),
            },
          },
        ],
      })
    );
    expect(screen.getByText("Front one")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Deck list destination" })).not.toBeInTheDocument();
    stop();
  });

  it("returns to the deck list when no active session exists", async () => {
    clearStudySessions();
    renderPage();

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();
  });

  it("shows route feedback when the Deck Entity is unavailable", () => {
    renderPage("/deck/missing-deck/study");

    expect(screen.getByRole("heading", { name: "Study session unavailable." })).toBeVisible();
    expect(mocks.abandonStudySession).not.toHaveBeenCalled();
    expect(mocks.touchStudySession).not.toHaveBeenCalled();
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

vi.mock("@/pages/study-session/model/actions/saveStudyOperation", async () => {
  const { moveStudySession } = await import("@/entities/study-session");
  return {
    saveStudyOperation: (
      operation: import("../model/studyOperation").StudyOperation,
      session: import("@/entities/study-session").StudySession
    ) => {
      void Promise.resolve(
        mocks.persistOperation(operation.uid, {
          fsrs: operation.fsrs,
          cardId: operation.cardId,
          answeredAt: operation.answeredAt,
        })
      ).catch(() => undefined);
      void moveStudySession({ ...session, lastStudiedAt: operation.answeredAt });
      return {
        session: { ...session, currentIndex: Math.min(session.currentIndex + 1, session.cardOrderIds.length - 1) },
        endReason: session.currentIndex + 1 === session.cardOrderIds.length ? "completed" : null,
      };
    },
  };
});
