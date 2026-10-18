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
import { createCard, deleteCard } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { clearStudySessions, getStudySession, subscribeStudySessions } from "@/entities/study-session";
import { startStudy, restoreStudySession } from "@/test/utils/entityFixtures";
import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { actAsync } from "@/test/act";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  receiveSnapshot: undefined as
    | ((snapshot: {
        docs: { id: string; data: () => Record<string, unknown> }[];
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

describe("StudySessionPage [STUDY-CONTROLS-07] [STUDY-ACTIONS-04] [STUDY-SESSION-03] [SETTINGS-04] [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-05] [STUDY-SESSION-05] [STUDY-CONTROLS-04]", () => {
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
    // Given: Establish the shared setup used by the following cases.
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
    await createCard("user-id", firstCard);
    await createCard("user-id", secondCard);
    startStudy(deckId, [firstCard, secondCard], mocks.preferences.study, "user-id");
  });

  it("exits view mode once for a held Enter without revealing the answer", () => {
    // Given: Prepare `surface` and any shared test state below.
    mocks.preferences.controls.viewMode = true;
    mocks.toggleViewMode.mockImplementation(() => {
      mocks.preferences.controls.viewMode = false;
    });
    renderPage();
    const surface = screen.getByRole("region", { name: "Card front text" });
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(surface, { key: "Enter" });
    fireEvent.keyDown(surface, { key: "Enter", repeat: true });
    fireEvent.keyDown(window, { key: "Enter", repeat: true });
    // Then: Verify the expected result in the assertions below.
    expect(mocks.toggleViewMode).toHaveBeenCalledOnce();
    expect(screen.getByText("Front one")).toBeVisible();
    expect(screen.queryByText("Back one")).not.toBeInTheDocument();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "Enter" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Back one")).toBeVisible();
  });

  it.each(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"])(
    "STUDY-CONTROLS-13 ignores held %s after saving and accepts a fresh press",
    async (key) => {
      // Given: Use this case's inputs and any shared test setup.
      renderPage();
      // When: Exercise `fireEvent.keyDown` with the prepared inputs.
      fireEvent.keyDown(window, { key });
      // Then: Verify the expected result in the assertions below.
      expect(await screen.findByText("Front two")).toBeVisible();
      // When: Exercise `actAsync` with the prepared inputs.
      await actAsync(async () => {
        fireEvent.keyDown(window, { key, repeat: true });
      });
      // Then: Verify the expected result in the assertions below.
      expect(screen.getByText("Front two")).toBeVisible();
      expect(getStudySession(deckId)?.currentIndex).toBe(1);
      expect(mocks.persistOperation).toHaveBeenCalledOnce();
      // When: Exercise `fireEvent.keyUp` with the prepared inputs.
      fireEvent.keyUp(window, { key });
      fireEvent.keyDown(window, { key });
      // Then: Verify the expected result in the assertions below.
      expect(await screen.findByRole("heading", { name: "Study complete" })).toBeVisible();
      expect(mocks.persistOperation).toHaveBeenCalledTimes(2);
    }
  );

  it("STUDY-CONTROLS-14 keeps playback active during held Space and pauses on a fresh press", () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.preferences = createPreferences({ cardInterval: 60 });
    renderPage();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: " " });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Pause" })).toBeVisible();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: " ", repeat: true });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Pause" })).toBeVisible();
    // When: Exercise `fireEvent.keyUp` with the prepared inputs.
    fireEvent.keyUp(window, { key: " " });
    fireEvent.keyDown(window, { key: " " });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
  });

  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
    { ctrlKey: true, shiftKey: true },
    { metaKey: true, shiftKey: true },
    { altKey: true, shiftKey: true },
  ])("STUDY-CONTROLS-15 ignores modified shortcuts %o without cancelling them", async (modifiers) => {
    // Given: Prepare `before` and any shared test state below.
    renderPage();
    const before = getStudySession(deckId);
    for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " ", "b"]) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Evaluate `actAsync` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await actAsync(async () => {
        expect(fireEvent.keyDown(window, { key, ...modifiers })).toBe(true);
      });
      expect(screen.getByText("Front one")).toBeVisible();
      expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
      expect(getStudySession(deckId)).toEqual(before);
    }
    // When: Observe the prepared result through the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(mocks.persistOperation).not.toHaveBeenCalled();
    expect(mocks.toggleShowSwipeButtonList).not.toHaveBeenCalled();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "Enter" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Back one")).toBeVisible();
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }])(
    "STUDY-CONTROLS-16 preserves view mode on modified Enter %o",
    (modifiers) => {
      // Given: Prepare `surface` and any shared test state below.
      mocks.preferences.controls.viewMode = true;
      mocks.toggleViewMode.mockImplementation(() => {
        mocks.preferences.controls.viewMode = false;
      });
      renderPage();
      const surface = screen.getByRole("region", { name: "Card front text" });
      // When: Exercise `fireEvent.keyDown` with the prepared inputs.
      fireEvent.keyDown(surface, { key: "Enter", ...modifiers });
      fireEvent.keyDown(surface, { key: "Enter", ...modifiers, shiftKey: true });
      // Then: Verify the expected result in the assertions below.
      expect(mocks.toggleViewMode).not.toHaveBeenCalled();
      expect(screen.getByText("Front one")).toBeVisible();
      // When: Exercise `fireEvent.keyDown` with the prepared inputs.
      fireEvent.keyDown(surface, { key: "Enter" });
      // Then: Verify the expected result in the assertions below.
      expect(mocks.toggleViewMode).toHaveBeenCalledOnce();
      // When: Exercise `fireEvent.keyDown` with the prepared inputs.
      fireEvent.keyDown(window, { key: "Enter", repeat: true });
      // Then: Verify the expected result in the assertions below.
      expect(screen.getByText("Front one")).toBeVisible();
      // When: Exercise `fireEvent.keyUp` with the prepared inputs.
      fireEvent.keyUp(window, { key: "Enter" });
      fireEvent.keyDown(window, { key: "Enter" });
      // Then: Verify the expected result in the assertions below.
      expect(screen.getByText("Back one")).toBeVisible();
    }
  );

  it("STUDY-CONTROLS-15 preserves Shift-only Enter and exact lowercase b matching", () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "Enter", shiftKey: true });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Back one")).toBeVisible();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "B", shiftKey: true });
    // Then: Verify the expected result in the assertions below.
    expect(mocks.toggleShowSwipeButtonList).not.toHaveBeenCalled();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "b", shiftKey: true });
    // Then: Verify the expected result in the assertions below.
    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();
  });

  it("STUDY-CONTROLS-15 leaves text entry and contenteditable keys native", async () => {
    // Given: Prepare `user` and any shared test state below.
    const user = userEvent.setup();
    renderPage();
    render(
      <>
        <input aria-label="Notes" />
        <textarea aria-label="Summary" />
        <div role="textbox" aria-label="Editable notes" contentEditable />
      </>
    );
    for (const field of screen.getAllByRole("textbox")) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `user.click` with the prepared inputs.
      await user.click(field);
      await user.keyboard("b b{ArrowLeft}{ArrowRight}{ArrowUp}{ArrowDown}{Enter}");
      // Then: The invoked verification helper checks the case's expected result.
    }
    // When: Evaluate `screen.getByRole` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: /^Notes$/ })).toHaveValue("b b");
    expect(screen.getByRole("textbox", { name: "Summary" })).toHaveValue("b b\n");
    expect(screen.getByRole("textbox", { name: "Editable notes" })).toHaveTextContent("b b");
    expect(screen.getByText("Front one")).toBeVisible();
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
    expect(mocks.persistOperation).not.toHaveBeenCalled();
    expect(mocks.toggleShowSwipeButtonList).not.toHaveBeenCalled();
  });

  it("renders the active session from stored Entity state", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage();

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open card actions" })).toBeVisible();
    expect(screen.queryByRole("group", { name: "Card actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to deck list" })).toBeVisible();
    expect(screen.getByText("Front one")).toBeVisible();
    expect(screen.getByText("not studied yet")).toBeVisible();
  });

  it("shows four ratings and prevents backward slider movement", () => {
    // Given: Prepare `slider` and any shared test state below.
    void setStudySessionIndex(deckId, 1);
    renderPage();
    expect(screen.getByText("Again")).toBeVisible();
    expect(screen.getByText("Hard")).toBeVisible();
    expect(screen.getByText("Good")).toBeVisible();
    expect(screen.getByText("Easy")).toBeVisible();
    const slider = screen.getByRole("slider", { name: "Study progress" });
    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(slider, { target: { value: "0" } });
    // Then: Verify the expected result in the assertions below.
    expect(slider).toHaveValue("1");
    expect(screen.getByText("Front two")).toBeVisible();
    expect(mocks.persistOperation).not.toHaveBeenCalled();
  });

  it.each([
    {
      controls: {
        cardSwipeUp: "RateEasy",
        cardSwipeDown: "RateHard",
        cardSwipeLeft: "RateAgain",
        cardSwipeRight: "RateGood",
      } as const,
      en: ["Again", "Easy", "Hard", "Good"],
      ja: ["Again", "Easy", "Hard", "Good"],
    },
    {
      controls: {
        cardSwipeUp: "GoBack",
        cardSwipeDown: "DoNothing",
        cardSwipeLeft: "GoToNextCard",
        cardSwipeRight: "RateHard",
      } as const,
      en: ["Skip", "End session", "No action", "Hard"],
      ja: ["スキップ", "学習を終了", "何もしない", "Hard"],
    },
  ])(
    "STUDY-CONTROLS-12 names the current actions and preserves focus on language changes: $en",
    async ({ controls, en, ja }) => {
      // Given: Prepare `session`, `preferences`, `directions` and any shared test state below.
      mocks.preferences = createPreferences({ controls });
      renderPage();
      const session = getStudySession(deckId);
      const preferences = structuredClone(mocks.preferences);
      const directions = ["left", "up", "down", "right"];
      const japaneseDirections = ["左", "上", "下", "右"];
      const buttons = directions.map((direction, index) =>
        screen.getByRole("button", { name: `Swipe ${direction}: ${en[index]}` })
      );
      for (const [index, button] of buttons.entries()) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        expect(button).toHaveTextContent(en[index]!);
        expect(button).toHaveAccessibleDescription(en[index]!);
      }
      // When: Exercise `buttons[0]!.focus` with the prepared inputs.
      buttons[0]!.focus();
      await actAsync(() => getI18n().changeLanguage("ja"));
      for (const [index, button] of buttons.entries()) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // Then: Verify the expected result in the assertions below.
        expect(button).toHaveAccessibleName(`${japaneseDirections[index]}へスワイプ: ${ja[index]}`);
        expect(button).toHaveTextContent(ja[index]!);
      }
      expect(buttons[0]).toHaveFocus();
      expect(getStudySession(deckId)).toEqual(session);
      expect(mocks.preferences).toEqual(preferences);
      expect(mocks.persistOperation).not.toHaveBeenCalled();
      expect(screen.getByText("Front one")).toBeVisible();
    }
  );

  it("allows the progress slider to advance and prevents returning to the skipped Card", async () => {
    // Given: Prepare `slider` and any shared test state below.
    renderPage();
    const slider = screen.getByRole("slider", { name: "Study progress" });
    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(slider, { target: { value: "1" } });

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Front two")).toBeVisible();
    expect(slider).toHaveValue("1");
    expect(getStudySession(deckId)?.currentIndex).toBe(1);

    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(slider, { target: { value: "0" } });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Front two")).toBeVisible();
    expect(slider).toHaveValue("1");
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
    expect(mocks.persistOperation).not.toHaveBeenCalled();
  });

  it.each([false, true])("reveals the answer from Enter with anonymous=%s", (isAnonymous) => {
    // Given: Use this case's inputs and any shared test setup.
    replaceAuthSession({ status: "authenticated", uid: "user-id", isAnonymous, displayName: null });
    renderPage();

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "Enter" });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Back one")).toBeVisible();
    expect(screen.queryByText("Front one")).not.toBeInTheDocument();
    expect(screen.queryByText("not studied yet")).not.toBeInTheDocument();
    expect(screen.queryByText(/3 times/)).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Card actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to deck list" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe controls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Playback controls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Swipe left/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("ignores directional shortcuts while showing the answer", async () => {
    // Given: Prepare `user` and any shared test state below.
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
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Enter}");

    await user.keyboard("{ArrowUp}{ArrowDown}{ArrowLeft}{ArrowRight}");

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Back one")).toBeVisible();
    expect(mocks.persistOperation).not.toHaveBeenCalled();
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
  });

  it("runs a configured back-text edge action and shows the next card front", async () => {
    // Given: Prepare `user` and any shared test state below.
    mocks.preferences = createPreferences({
      controls: {
        showBackTextSwipeOverlays: true,
        cardSwipeLeft: "RateGood",
      },
    });
    const user = userEvent.setup();
    renderPage();
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Front one" }));

    await user.click(screen.getByRole("button", { name: "Swipe left" }));

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.getByText("Front two")).toBeVisible());
    expect(screen.queryByText("Back two")).not.toBeInTheDocument();
    expect(mocks.persistOperation).toHaveBeenCalledExactlyOnceWith(
      "user-id",
      expect.objectContaining({ cardId: "first-card", fsrs: expect.objectContaining({ reps: 1 }) })
    );
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });

  it("keeps Space native while the answer scrolling surface is focused", async () => {
    // Given: Prepare `user` and any shared test state below.
    const user = userEvent.setup();
    renderPage();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Enter}");
    const answerSurface = screen.getByRole("region", { name: "Study answer" });
    answerSurface.focus();

    await user.keyboard(" ");
    await user.keyboard("{Enter}");

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
  });

  it("keeps the ArrowRight shortcut active while the front card is focused", async () => {
    // Given: Prepare `user`, `front` and any shared test state below.
    const user = userEvent.setup();
    renderPage();

    const front = screen.getByRole("button", { name: "Front one" });
    front.focus();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{ArrowRight}");

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.getByText("Front two")).toBeVisible());
    expect(mocks.persistOperation).toHaveBeenCalledOnce();
    expect(screen.queryByText("Front one")).not.toBeInTheDocument();
  });

  it("shows successful swipe feedback through the shared Toast viewport", async () => {
    // Given: Prepare `user` and any shared test state below.
    mocks.preferences = createPreferences({
      appearance: { darkMode: false, showSwipeFeedback: true },
      cardSwipeRight: "RateGood",
    });
    const user = userEvent.setup();
    renderPage();

    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{ArrowRight}");

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.getByText("Front two")).toBeVisible());
    expect(screen.getByTestId("swipe-feedback-direction")).toHaveAttribute(
      "data-swipe-feedback-direction",
      "cardSwipeRight"
    );
    expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Swiped right");
    expect(screen.getAllByText("Swiped right")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
  });

  it("shows a save failure toast and allows retry from the same Card", async () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.preferences = createPreferences({ cardSwipeRight: "RateGood" });
    mocks.persistOperation.mockRejectedValueOnce(new Error("permission-denied"));
    renderPage();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    // Then: Verify the expected result in the assertions below.
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Unable to save progress. Check your connection and retry.")
    );
    expect(screen.getByText("Front one")).toBeVisible();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Front two")).toBeVisible();
  });

  it("keeps the route available for a final-answer rollback after releasing the save lock", async () => {
    // Given: Prepare `previous`, `request` and any shared test state below.
    mocks.preferences = createPreferences({ cardSwipeRight: "RateGood" });
    await setStudySessionIndex(deckId, 1);
    const previous = getStudySession(deckId);
    if (!previous) throw new Error("Expected final Card");
    const request = Promise.withResolvers<void>();
    mocks.persistOperation.mockReturnValueOnce(request.promise);
    renderPage();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    act(() => clearStudySessions());
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByText("Front two")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Study session unavailable." })).not.toBeInTheDocument();
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      request.reject(new Error("permission-denied"));
      await request.promise.catch(() => undefined);
    });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to save progress. Check your connection and retry.");
    expect(screen.getByRole("heading", { name: "Study session unavailable." })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Deck list destination" })).not.toBeInTheDocument();
    // When: Exercise `act` with the prepared inputs.
    act(() => restoreStudySession(previous));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Front two")).toBeVisible();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.queryByText("Front two")).not.toBeInTheDocument());
  });

  it("uses the latest locale when persistence resolves after a language change", async () => {
    // Given: Prepare `request` and any shared test state below.
    mocks.preferences = createPreferences({
      appearance: { darkMode: false, showSwipeFeedback: true },
      cardSwipeRight: "RateGood",
    });
    const request = Promise.withResolvers<void>();
    mocks.persistOperation.mockReturnValueOnce(request.promise);
    renderPage();

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    act(() => {
      void getI18n().changeLanguage("ja");
    });
    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("status", { name: "トースト通知" })).toHaveTextContent("右へスワイプしました");
    expect(screen.getByTestId("swipe-feedback-direction")).toHaveAttribute(
      "data-swipe-feedback-direction",
      "cardSwipeRight"
    );
    expect(screen.queryByText("Swiped right")).not.toBeInTheDocument();
    expect(screen.getByText("Front two")).toBeVisible();
  });

  it("shows configured Help rows without letting dialog keys change Study state", () => {
    // Given: Prepare `sessionBeforeHelp`, `trigger` and any shared test state below.
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
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    // Then: Verify the expected result in the assertions below.
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

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "b" });
    fireEvent.keyDown(window, { key: " " });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Front one")).toBeVisible();
    expect(getStudySession(deckId)).toEqual(sessionBeforeHelp);
    expect(mocks.persistOperation).not.toHaveBeenCalled();
    expect(mocks.toggleShowSwipeButtonList).not.toHaveBeenCalled();

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(screen.getByRole("button", { name: "Close help" }), { key: "Escape" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("updates semantic Help labels without resetting the mounted session or controls", () => {
    // Given: Prepare `sessionBeforeLanguageChange`, `cardBeforeLanguageChange`, `autoPlayBeforeLanguageChange` and any shared test state below.
    mocks.preferences = createPreferences({ defaultAutoPlay: true, cardInterval: 60 });
    clearStudySessions();
    startStudy(deckId, [firstCard, secondCard], mocks.preferences.study, "user-id");
    renderPage();
    const sessionBeforeLanguageChange = getStudySession(deckId);
    const cardBeforeLanguageChange = screen.getByText("Front one");
    const autoPlayBeforeLanguageChange = screen.getByRole("button", { name: "Pause" });

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open study help" }));
    const dialogBeforeLanguageChange = screen.getByRole("dialog", { name: "Study controls" });

    act(() => {
      void getI18n().changeLanguage("ja");
    });

    const localizedDialog = screen.getByRole("dialog", { name: "学習画面の操作" });
    // Then: Verify the expected result in the assertions below.
    expect(localizedDialog).toBe(dialogBeforeLanguageChange);
    expect(localizedDialog).toHaveTextContent("上矢印 / 上へスワイプEasy（簡単）で回答して次へ");
    expect(screen.getByRole("button", { name: "一時停止" })).toBe(autoPlayBeforeLanguageChange);
    expect(screen.getByText("Front one")).toBe(cardBeforeLanguageChange);
    expect(getStudySession(deckId)).toEqual(sessionBeforeLanguageChange);
  });

  it("pauses autoplay while Help is open and resumes without changing its explicit state", async () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.preferences = createPreferences({ defaultAutoPlay: true, cardInterval: 1 });
    clearStudySessions();
    startStudy(deckId, [firstCard, secondCard], mocks.preferences.study, "user-id");
    vi.useFakeTimers();

    // When: Evaluate `fireEvent.click` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    try {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "Open study help" }));

      await actAsync(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Then: Check the expected result after the operation in this branch.
      expect(screen.getByText("Front one")).toBeVisible();
      // Then: Check the expected result after the operation in this branch.
      expect(screen.getByRole("button", { name: "Pause" })).toBePressed();

      fireEvent.click(screen.getByRole("button", { name: "Close help" }));
      await actAsync(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Then: Check the expected result after the operation in this branch.
      expect(screen.getByText("Front two")).toBeVisible();
      // Then: Check the expected result after the operation in this branch.
      expect(screen.getByRole("button", { name: "Pause" })).toBePressed();
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns from a deep-linked Study to the Deck list without changing the resumable session", () => {
    // Given: Prepare `sessionBeforeExit` and any shared test state below.
    renderPage();
    const sessionBeforeExit = getStudySession(deckId);
    openStudyActions();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Back to deck list" }));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();
    expect(getStudySession(deckId)).toEqual(sessionBeforeExit);
    expect(mocks.abandonStudySession).not.toHaveBeenCalled();
  });

  it("shows the session Card count after advancing with the slider and keeps completion on the Study route", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage(`/deck/${deckId}/study`, "/previous");
    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(screen.getByRole("slider", { name: "Study progress" }), { target: { value: "1" } });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Front two")).toBeVisible();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Swipe up: Easy" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Study complete" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Study complete" })).toHaveFocus();
    expect(screen.getByText("Session: 2 cards")).toBeVisible();
    expect(screen.queryByRole("heading", { level: 1, name: "Deck list destination" })).not.toBeInTheDocument();
    expect(getStudySession(deckId)).toBeUndefined();

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "ArrowUp" });
    // Then: Verify the expected result in the assertions below.
    expect(mocks.persistOperation).toHaveBeenCalledOnce();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Back to deck list" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Browser back" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Previous destination" })).toBeVisible();
    expect(screen.queryByRole("heading", { level: 1, name: "Study complete" })).not.toBeInTheDocument();
  });

  it("keeps study actions available while the Header stays hidden", () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });

    renderPage();
    // When: Exercise `openStudyActions` with the prepared inputs.
    const actions = openStudyActions();

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(actions).toBeVisible();
    expect(screen.getByRole("button", { name: "Back to deck list" })).toBeVisible();
    expect(screen.getByText("not studied yet")).toBeVisible();
  });

  it("delegates visibility toggles to persisted preference actions", () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();
    openStudyActions();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Help button" }));
    fireEvent.click(screen.getByRole("button", { name: "Swipe controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Playback controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip control" }));
    fireEvent.click(screen.getByRole("button", { name: "Card details" }));

    // Then: Verify the expected result in the assertions below.
    expect(mocks.toggleShowHelp).toHaveBeenCalledOnce();
    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();
    expect(mocks.toggleShowPlaybackControls).toHaveBeenCalledOnce();
    expect(mocks.toggleShowSkip).toHaveBeenCalledOnce();
    expect(mocks.toggleShowCardDetails).toHaveBeenCalledOnce();
  });

  it("shows and hides the skip button from preferences", () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.preferences = createPreferences({ controls: { showSkip: false } });
    // When: Exercise `renderPage` with the prepared inputs.
    const { unmount } = renderPage();
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeInTheDocument();
    // When: Exercise `unmount` with the prepared inputs.
    unmount();

    mocks.preferences = createPreferences({ controls: { showSkip: true } });
    renderPage();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Skip" })).toBeVisible();
  });

  it.each([
    ["swipe", "Swipe controls", "{Enter}"],
    ["swipe", "Swipe controls", " "],
    ["playback", "Playback controls", "{Enter}"],
    ["playback", "Playback controls", " "],
  ] as const)("uses %s visibility with %s without running a Study shortcut", async (control, label, key) => {
    // Given: Prepare `user` and any shared test state below.
    const user = userEvent.setup();
    renderPage();
    openStudyActions();

    screen.getByRole("button", { name: label }).focus();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard(key);

    // Then: Verify the expected result in the assertions below.
    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledTimes(control === "swipe" ? 1 : 0);
    expect(mocks.toggleShowPlaybackControls).toHaveBeenCalledTimes(control === "playback" ? 1 : 0);
    expect(screen.queryByText("Back one")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
  });

  it("keeps the swipe visibility shortcut active while a toolbar button is focused", async () => {
    // Given: Prepare `user`, `swipeToggle` and any shared test state below.
    const user = userEvent.setup();
    renderPage();
    openStudyActions();

    const swipeToggle = screen.getByRole("button", { name: "Swipe controls" });
    swipeToggle.focus();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("b");

    // Then: Verify the expected result in the assertions below.
    expect(mocks.toggleShowSwipeButtonList).toHaveBeenCalledOnce();
    expect(mocks.persistOperation).not.toHaveBeenCalled();
  });

  it.each(["{ArrowUp}", "{ArrowDown}", "{ArrowLeft}", "{ArrowRight}"])(
    "keeps %s native to the focused progress slider",
    async (key) => {
      // Given: Prepare `user`, `progress` and any shared test state below.
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
      // When: Exercise `user.keyboard` with the prepared inputs.
      await user.keyboard(key);

      // Then: Verify the expected result in the assertions below.
      expect(mocks.persistOperation).not.toHaveBeenCalled();
    }
  );

  it("renders the selected visibility combination", () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.preferences = createPreferences({
      controls: { showCardDetails: false, showSwipeButtonList: false, showPlaybackControls: false },
    });

    renderPage();
    // When: Exercise `openStudyActions` with the prepared inputs.
    openStudyActions();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Swipe controls" })).not.toBePressed();
    expect(screen.getByRole("button", { name: "Playback controls" })).not.toBePressed();
    expect(screen.getByRole("button", { name: "Card details" })).not.toBePressed();
    expect(screen.queryByRole("button", { name: /^Swipe left/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
    expect(screen.queryByText("not studied yet")).not.toBeInTheDocument();
    expect(screen.queryByText(/3 times/)).not.toBeInTheDocument();
  });

  it("disables playback visibility when the card interval is zero", () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.preferences = createPreferences({ cardInterval: 0 });

    renderPage();
    // When: Exercise `openStudyActions` with the prepared inputs.
    openStudyActions();

    const playbackToggle = screen.getByRole("button", { name: "Playback controls" });
    // Then: Verify the expected result in the assertions below.
    expect(playbackToggle).toHaveAttribute("aria-disabled", "true");
    expect(playbackToggle).not.toBeDisabled();
    expect(playbackToggle).toHaveAccessibleDescription(
      "Playback controls unavailable because the card interval is set to 0"
    );
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("shows loading feedback while active session cards are unavailable", async () => {
    // Given: Use this case's inputs and any shared test setup.
    await deleteCard("user-id", firstCard.id);
    await deleteCard("user-id", secondCard.id);
    clearStudySessions();
    startStudy(deckId, [firstCard], mocks.preferences.study, "user-id");

    // When: Exercise `renderPage` with the prepared inputs.
    renderPage();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { name: "Loading…" })).toBeVisible();
  });

  it("stays on a direct study route until the saved session arrives", async () => {
    // Given: Prepare `saved`, `stop` and any shared test state below.
    const saved = getStudySession(deckId);
    if (saved === undefined) throw new Error("Expected a saved session");
    clearStudySessions();
    const stop = subscribeStudySessions("user-id", vi.fn());
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { name: "Loading…" })).toBeVisible();
    await waitFor(() => expect(mocks.receiveSnapshot).toBeDefined());
    // When: Exercise `act` with the prepared inputs.
    act(() =>
      mocks.receiveSnapshot?.({
        metadata: { fromCache: false, hasPendingWrites: false },
        docs: [
          {
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
        ],
      })
    );
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Front one")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Deck list destination" })).not.toBeInTheDocument();
    stop();
  });

  it("keeps an absent session on the route until the user returns to the deck list", async () => {
    // Given: Use this case's inputs and any shared test setup.
    clearStudySessions();
    renderPage();
    expect(screen.getByRole("heading", { name: "Study session unavailable." })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Deck list destination" })).not.toBeInTheDocument();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Back to deck list" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();
  });

  it("shows route feedback when the Deck Entity is unavailable", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage("/deck/missing-deck/study");

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { name: "Study session unavailable." })).toBeVisible();
    expect(mocks.abandonStudySession).not.toHaveBeenCalled();
    expect(mocks.touchStudySession).not.toHaveBeenCalled();
  });

  it("rejects a route without a deck id", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `render` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
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
  const { applyStudySessionResult } = await import("@/test/utils/entityFixtures");
  return {
    saveStudyOperation: async (
      operation: import("../model/studyOperation").StudyOperation,
      session: import("@/entities/study-session").StudySession
    ) => {
      await Promise.resolve(
        mocks.persistOperation(operation.uid, {
          fsrs: operation.fsrs,
          cardId: operation.cardId,
          answeredAt: operation.answeredAt,
        })
      );
      const result = {
        session: { ...session, currentIndex: Math.min(session.currentIndex + 1, session.cardOrderIds.length - 1) },
        endReason: session.currentIndex + 1 === session.cardOrderIds.length ? ("completed" as const) : null,
      };
      applyStudySessionResult({ ...result.session, lastStudiedAt: operation.answeredAt }, result.endReason);
      return result;
    },
  };
});
