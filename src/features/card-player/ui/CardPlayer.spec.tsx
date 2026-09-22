import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { CardPlayer } from "./CardPlayer";

const playbackUnavailableDescription = "Playback controls unavailable because the card interval is set to 0";

const toolbarProps = () => ({
  viewMode: false,
  onToggleViewMode: vi.fn(),
  showViewMode: true,
  onToggleShowViewMode: vi.fn(),
  showHelp: true,
  showCardDetails: true,
  showSwipeControls: true,
  showPlaybackControls: true,
  showSkipControls: true,
  playbackControlsAvailable: true,
  onBack: vi.fn(),
  onToggleCardDetails: vi.fn(),
  onToggleHelp: vi.fn(),
  onToggleSwipeControls: vi.fn(),
  onTogglePlaybackControls: vi.fn(),
  onToggleSkipControls: vi.fn(),
  help: {
    open: false,
    rows: [{ control: "cardSwipeUp", action: "GoToNextCard" }] as const,
    onOpen: vi.fn(),
    onClose: vi.fn(),
  },
});

const swipeLeft = (target: HTMLElement) => {
  const start = { identifier: 1, target, clientX: 200, clientY: 24 };
  const end = { identifier: 1, target, clientX: 20, clientY: 24 };

  fireEvent.touchStart(target, { touches: [start], targetTouches: [start], changedTouches: [start] });
  fireEvent.touchMove(target, { touches: [end], targetTouches: [end], changedTouches: [end] });
  fireEvent.touchEnd(target, { touches: [], targetTouches: [], changedTouches: [end] });
};

const swipeUp = (target: HTMLElement) => {
  const start = { identifier: 1, target, clientX: 24, clientY: 200 };
  const end = { identifier: 1, target, clientX: 24, clientY: 20 };

  fireEvent.touchStart(target, { touches: [start], targetTouches: [start], changedTouches: [start] });
  fireEvent.touchMove(target, { touches: [end], targetTouches: [end], changedTouches: [end] });
  fireEvent.touchEnd(target, { touches: [], targetTouches: [], changedTouches: [end] });
};

const swipeWithMouse = (
  target: HTMLElement,
  start: { clientX: number; clientY: number },
  end: { clientX: number; clientY: number },
  button = 0
) => {
  fireEvent.mouseDown(target, { ...start, button });
  fireEvent.mouseMove(document, { ...end, button });
  fireEvent.mouseUp(document, { ...end, button });
};

describe("CardPlayer [STUDY-CONTROLS-05] [STUDY-CONTROLS-06] [STUDY-CONTROLS-07] [STUDY-ACTIONS-01] [STUDY-CONTROLS-04] [DECK-NAVIGATION-09]", () => {
  it("ignores reading gestures and their trailing click while keeping explicit buttons active", () => {
    const props = toolbarProps();
    const onSwipeUp = vi.fn();
    const onSwipeLeft = vi.fn();
    render(
      <CardPlayer
        {...props}
        viewMode
        frontTextSlot={<div>Long front</div>}
        onSwipeUp={onSwipeUp}
        onSwipeLeft={onSwipeLeft}
        swipeButtonList={{ onClickLeft: onSwipeLeft }}
      />
    );
    const front = screen.getByText("Long front");
    swipeUp(front);
    swipeLeft(front);
    swipeWithMouse(front, { clientX: 100, clientY: 200 }, { clientX: 100, clientY: 20 });
    fireEvent.click(front);
    expect(onSwipeUp).not.toHaveBeenCalled();
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(props.onToggleViewMode).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Swipe left" }));
    expect(onSwipeLeft).toHaveBeenCalledOnce();
  });

  it("keeps view mode active while the front text has a selection", () => {
    const props = toolbarProps();
    render(<CardPlayer {...props} viewMode frontTextSlot={<div>Selectable front</div>} />);
    const text = screen.getByText("Selectable front");
    const selection = window.getSelection();
    if (selection === null) throw new Error("Selection API unavailable");
    const range = document.createRange();
    range.selectNodeContents(text);
    selection.removeAllRanges();
    selection.addRange(range);
    expect(selection.toString()).toBe("Selectable front");
    fireEvent.click(text);
    expect(props.onToggleViewMode).not.toHaveBeenCalled();
    selection.removeAllRanges();
    fireEvent.click(text);
    expect(props.onToggleViewMode).toHaveBeenCalledOnce();
  });

  it("exits reading on a tap, but reserves Space for scrolling", () => {
    const props = toolbarProps();
    render(<CardPlayer {...props} viewMode frontTextSlot={<div>Long front</div>} />);
    const region = screen.getByRole("region", { name: "Card front text" });
    expect(region).toHaveFocus();
    fireEvent.keyDown(region, { key: " " });
    fireEvent.keyUp(region, { key: " " });
    expect(props.onToggleViewMode).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Long front"));
    expect(props.onToggleViewMode).toHaveBeenCalledTimes(1);
  });

  it("keeps the reading preference from changing answer gestures", () => {
    const onSwipeLeft = vi.fn();
    const onAnswerClick = vi.fn();
    render(
      <CardPlayer
        {...toolbarProps()}
        viewMode
        showBackText
        allowBackHorizontalSwipe
        backTextSlot={<div>Answer</div>}
        onSwipeLeft={onSwipeLeft}
        onAnswerClick={onAnswerClick}
      />
    );
    fireEvent.click(screen.getByText("Answer"));
    expect(onAnswerClick).toHaveBeenCalledOnce();
    swipeLeft(screen.getByText("Answer"));
    expect(onSwipeLeft).toHaveBeenCalledOnce();
  });

  it("uses the edit shortcut slot to toggle visibility only while actions are open", async () => {
    function Player() {
      const [visible, setVisible] = useState(true);
      return (
        <CardPlayer
          {...toolbarProps()}
          editLink={{
            visible,
            onToggle: () => setVisible((value) => !value),
            element: <a href="/card/current/edit">Edit current card</a>,
          }}
        />
      );
    }
    render(<Player />);
    expect(screen.getByRole("link", { name: "Edit current card" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Open card actions" }));
    expect(screen.queryByRole("link", { name: "Edit current card" })).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Edit link" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Open card actions" })).toHaveFocus();
    expect(screen.queryByRole("link", { name: "Edit current card" })).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(screen.getByRole("button", { name: "Edit link" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("link", { name: "Edit current card" })).toBeVisible();
  });

  it("hides the edit link on the answer and does not add editing to Study", () => {
    const props = toolbarProps();
    const view = render(
      <CardPlayer
        {...props}
        showBackText
        editLink={{ visible: true, onToggle: vi.fn(), element: <a href="/edit">Edit</a> }}
      />
    );
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    view.rerender(<CardPlayer {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));
    expect(screen.queryByRole("button", { name: "Edit link" })).not.toBeInTheDocument();
  });

  it("shows only the answer on the back", () => {
    render(
      <CardPlayer
        {...toolbarProps()}
        showBackText
        backTextSlot={<div>Back</div>}
        cardOverlaySlot={<div>Card metadata</div>}
        frontTextSlot={<div>Front</div>}
        controller={{ autoPlay: false, index: 0, numberOfCards: 2 }}
        swipeButtonList={{ onClickLeft: vi.fn() }}
      />
    );

    expect(screen.getByText("Back")).toBeVisible();
    const answerSurface = screen.getByRole("region", { name: "Study answer" });
    expect(answerSurface).toBeVisible();
    expect(answerSurface).toHaveAttribute("data-study-answer-scroll");
    expect(answerSurface).toHaveAttribute("tabindex", "0");
    expect(screen.queryByText("Front")).not.toBeInTheDocument();
    expect(screen.queryByText("Card metadata")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Card actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open card actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to deck list" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe controls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Playback controls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("runs configured back-text edge actions without clicking the answer", () => {
    const onBackClick = vi.fn();
    const onClickLeft = vi.fn();
    const onClickRight = vi.fn();
    const { rerender } = render(
      <CardPlayer
        {...toolbarProps()}
        showBackText
        backTextSlot={
          <button type="button" onClick={onBackClick}>
            Back
          </button>
        }
        backTextOverlay={{ onClickLeft, onClickRight }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Swipe left" }));
    fireEvent.click(screen.getByRole("button", { name: "Swipe right" }));

    expect(onClickLeft).toHaveBeenCalledOnce();
    expect(onClickRight).toHaveBeenCalledOnce();
    expect(onBackClick).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Swipe up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe down" })).not.toBeInTheDocument();

    rerender(
      <CardPlayer
        {...toolbarProps()}
        showSwipeControls={false}
        frontTextSlot={<div>Front</div>}
        backTextOverlay={{ onClickLeft, onClickRight }}
      />
    );
    expect(screen.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe right" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Study answer" })).not.toBeInTheDocument();
  });

  it("forwards edge wheel input to answer scrolling without running the action", () => {
    const onClickLeft = vi.fn();
    render(
      <CardPlayer
        {...toolbarProps()}
        showBackText
        backTextSlot={<div>Long back text</div>}
        backTextOverlay={{ onClickLeft }}
      />
    );
    const answerSurface = screen.getByRole("region", { name: "Study answer" });
    const leftOverlay = screen.getByRole("button", { name: "Swipe left" });

    expect(fireEvent.wheel(leftOverlay, { deltaY: 64, deltaMode: 0 })).toBe(false);

    expect(answerSurface.scrollTop).toBe(64);
    expect(leftOverlay).toHaveClass("touch-pan-y");
    expect(onClickLeft).not.toHaveBeenCalled();
  });

  it("STUDY-CONTROLS-05 keeps Help available while opening the remaining study actions", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onToggleCardDetails = vi.fn();
    const onToggleSwipeControls = vi.fn();
    const onTogglePlaybackControls = vi.fn();
    const onToggleSkipControls = vi.fn();
    render(
      <CardPlayer
        {...toolbarProps()}
        onBack={onBack}
        onToggleCardDetails={onToggleCardDetails}
        onToggleSwipeControls={onToggleSwipeControls}
        onTogglePlaybackControls={onTogglePlaybackControls}
        onToggleSkipControls={onToggleSkipControls}
        cardOverlaySlot={<div>Card metadata</div>}
        frontTextSlot={<div>Front</div>}
      />
    );

    const openActions = screen.getByRole("button", { name: "Open card actions" });
    const helpTrigger = screen.getByRole("button", { name: "Open study help" });
    expect(openActions).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "Card actions" })).not.toBeInTheDocument();
    expect(helpTrigger).toBeVisible();
    expect(screen.getByRole("button", { name: "Back to deck list" })).toBeVisible();

    fireEvent.click(openActions);

    const closeActions = screen.getByRole("button", { name: "Close card actions" });
    const back = screen.getByRole("button", { name: "Back to deck list" });
    const swipeToggle = screen.getByRole("button", { name: "Swipe controls" });
    const playbackToggle = screen.getByRole("button", { name: "Playback controls" });
    const skipToggle = screen.getByRole("button", { name: "Skip control" });
    const detailsToggle = screen.getByRole("button", { name: "Card details" });
    const helpToggle = screen.getByRole("button", { name: "Help button" });
    const actions = screen.getByRole("group", { name: "Card actions" });
    expect(closeActions).toHaveAttribute("aria-expanded", "true");
    expect(back).toBeVisible();
    expect(helpToggle).toBeVisible();
    expect(screen.queryByRole("button", { name: "Open study help" })).not.toBeInTheDocument();
    expect(helpToggle).toHaveAttribute("aria-pressed", "true");
    expect(helpToggle).toHaveAttribute("title", "Hide help button");
    expect(swipeToggle).toHaveAttribute("aria-pressed", "true");
    expect(playbackToggle).toHaveAttribute("aria-pressed", "true");
    expect(skipToggle).toHaveAttribute("aria-pressed", "true");
    expect(detailsToggle).toHaveAttribute("aria-pressed", "true");
    expect(swipeToggle).toHaveAttribute("title", "Hide swipe controls");
    expect(playbackToggle).toHaveAttribute("title", "Hide playback controls");
    expect(skipToggle).toHaveAttribute("title", "Hide skip control");
    expect(detailsToggle).toHaveAttribute("title", "Hide card details");
    expect(actions).not.toContainElement(helpToggle);
    expect(actions).not.toContainElement(back);
    expect(actions).not.toContainElement(screen.getByText("Card metadata"));

    closeActions.focus();
    await user.tab();
    expect(helpToggle).toHaveFocus();

    fireEvent.click(back);
    fireEvent.click(swipeToggle);
    fireEvent.click(playbackToggle);
    fireEvent.click(skipToggle);
    fireEvent.click(detailsToggle);

    expect(onBack).toHaveBeenCalledOnce();
    expect(onToggleSwipeControls).toHaveBeenCalledOnce();
    expect(onTogglePlaybackControls).toHaveBeenCalledOnce();
    expect(onToggleSkipControls).toHaveBeenCalledOnce();
    expect(onToggleCardDetails).toHaveBeenCalledOnce();

    fireEvent.keyDown(helpToggle, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open card actions" })).toHaveFocus();
    expect(screen.queryByRole("group", { name: "Card actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open study help" })).toBeVisible();
  });

  it("STUDY-CONTROLS-05 keeps the Help visibility toggle mounted while visibility changes", () => {
    const onToggleHelp = vi.fn();
    const props = toolbarProps();
    const { rerender } = render(<CardPlayer {...props} onToggleHelp={onToggleHelp} frontTextSlot={<div>Front</div>} />);

    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));

    const actions = screen.getByRole("group", { name: "Card actions" });
    const helpToggle = screen.getByRole("button", { name: "Help button" });
    expect(actions).not.toContainElement(helpToggle);
    expect(helpToggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("toolbar-shortcuts")).toContainElement(screen.getByRole("button", { name: "View mode" }));
    expect(screen.getByTestId("toolbar-shortcuts")).toContainElement(
      screen.getByRole("button", { name: /card actions/ })
    );

    rerender(<CardPlayer {...props} showHelp={false} onToggleHelp={onToggleHelp} frontTextSlot={<div>Front</div>} />);

    const hiddenHelpToggle = screen.getByRole("button", { name: "Help button" });
    expect(hiddenHelpToggle).toBe(helpToggle);
    expect(hiddenHelpToggle).toHaveAttribute("aria-pressed", "false");
    expect(hiddenHelpToggle).toHaveAttribute("title", "Show help button");
    fireEvent.click(hiddenHelpToggle);
    expect(onToggleHelp).toHaveBeenCalledOnce();
  });

  it("places view mode on the toolbar to the left of the Help icon and toggles it on and off", () => {
    const onToggleViewMode = vi.fn();
    const props = toolbarProps();
    const { rerender } = render(
      <CardPlayer {...props} viewMode={false} onToggleViewMode={onToggleViewMode} frontTextSlot={<div>Front</div>} />
    );

    const viewModeButton = screen.getByRole("button", { name: "View mode" });
    expect(viewModeButton).toBeVisible();
    expect(viewModeButton).toHaveAttribute("aria-pressed", "false");
    expect(viewModeButton).toHaveAttribute("title", "Enter view mode");
    expect(screen.getByTestId("toolbar-shortcuts")).toContainElement(
      screen.getByRole("button", { name: "Open study help" })
    );
    expect(screen.getByTestId("toolbar-shortcuts")).toContainElement(
      screen.getByRole("button", { name: /card actions/ })
    );

    fireEvent.click(viewModeButton);
    expect(onToggleViewMode).toHaveBeenCalledOnce();

    rerender(
      <CardPlayer {...props} viewMode={true} onToggleViewMode={onToggleViewMode} frontTextSlot={<div>Front</div>} />
    );
    expect(viewModeButton).toHaveAttribute("aria-pressed", "true");
    expect(viewModeButton).toHaveAttribute("title", "Exit view mode");
    expect(viewModeButton).toHaveClass("bg-surface-muted", "text-accent-primary");

    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));
    expect(viewModeButton).toBeVisible();
    const actions = screen.getByRole("group", { name: "Card actions" });
    expect(actions).not.toContainElement(viewModeButton);

    fireEvent.click(viewModeButton);
    expect(props.onToggleShowViewMode).toHaveBeenCalledOnce();
    rerender(<CardPlayer {...props} viewMode showViewMode={false} frontTextSlot={<div>Front</div>} />);
    expect(viewModeButton).toHaveAttribute("aria-pressed", "false");
    expect(viewModeButton).toHaveAttribute("title", "Show view mode button");
    fireEvent.click(screen.getByRole("button", { name: "Close card actions" }));
    expect(screen.queryByRole("button", { name: "View mode" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));
    const visibilityButton = screen.getByRole("button", { name: "View mode" });
    fireEvent.click(visibilityButton);
    expect(props.onToggleShowViewMode).toHaveBeenCalledTimes(2);
    rerender(<CardPlayer {...props} viewMode frontTextSlot={<div>Front</div>} />);
    fireEvent.click(screen.getByRole("button", { name: "Close card actions" }));
    expect(screen.getByRole("button", { name: "View mode" })).toHaveAttribute("title", "Exit view mode");
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));

    expect(onToggleViewMode).toHaveBeenCalledOnce();

    fireEvent.keyDown(screen.getByRole("button", { name: "View mode" }), { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open card actions" })).toHaveFocus();
  });

  it.each([
    { showHelp: true, showViewMode: true, showEdit: true },
    { showHelp: false, showViewMode: true, showEdit: true },
    { showHelp: true, showViewMode: true, showEdit: false },
    { showHelp: false, showViewMode: true, showEdit: false },
    { showHelp: true, showViewMode: false, showEdit: true },
    { showHelp: false, showViewMode: false, showEdit: false },
  ])("STUDY-CONTROLS-05 composes visible shortcuts: %o", ({ showHelp, showViewMode, showEdit }) => {
    render(
      <CardPlayer
        {...toolbarProps()}
        showHelp={showHelp}
        showViewMode={showViewMode}
        editLink={{ visible: showEdit, onToggle: vi.fn(), element: <a href="/edit">Edit current card</a> }}
      />
    );

    const trigger = screen.getByRole("button", { name: "Open card actions" });
    const shortcuts = screen.getByTestId("toolbar-shortcuts");
    expect(
      within(shortcuts)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Open card actions", ...(showHelp ? ["Open study help"] : []), ...(showViewMode ? ["View mode"] : [])]);
    expect(within(shortcuts).queryByRole("link", { name: "Edit current card" }) !== null).toBe(showEdit);
    expect(within(shortcuts).queryAllByRole("button")).toHaveLength(1 + Number(showHelp) + Number(showViewMode));
    expect(within(shortcuts).queryAllByRole("link")).toHaveLength(Number(showEdit));

    fireEvent.click(trigger);
    expect(
      within(shortcuts)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Close card actions", "Help button", "View mode", "Edit link"]);
    expect(within(shortcuts).queryByRole("link")).not.toBeInTheDocument();
    fireEvent.keyDown(within(shortcuts).getByRole("button", { name: "Edit link" }), { key: "Escape" });
    expect(trigger).toHaveFocus();
    expect(within(shortcuts).queryAllByRole("button")).toHaveLength(1 + Number(showHelp) + Number(showViewMode));
    expect(within(shortcuts).queryAllByRole("link")).toHaveLength(Number(showEdit));
  });

  it("shows and hides all card details from the persisted preference value", () => {
    const { rerender } = render(
      <CardPlayer
        {...toolbarProps()}
        cardOverlaySlot={<div>Difficulty, seen count, and last seen</div>}
        frontTextSlot={<div>Front</div>}
      />
    );

    expect(screen.getByText("Difficulty, seen count, and last seen")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));

    rerender(
      <CardPlayer
        {...toolbarProps()}
        showCardDetails={false}
        cardOverlaySlot={<div>Difficulty, seen count, and last seen</div>}
        frontTextSlot={<div>Front</div>}
      />
    );
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("title", "Show card details");
    expect(screen.queryByText("Difficulty, seen count, and last seen")).not.toBeInTheDocument();

    rerender(
      <CardPlayer
        {...toolbarProps()}
        cardOverlaySlot={<div>Difficulty, seen count, and last seen</div>}
        frontTextSlot={<div>Front</div>}
      />
    );
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("title", "Hide card details");
    expect(screen.getByText("Difficulty, seen count, and last seen")).toBeVisible();
  });

  it("describes hidden controls and keeps the unavailable playback toggle disabled", () => {
    const onTogglePlaybackControls = vi.fn();
    render(
      <CardPlayer
        {...toolbarProps()}
        showSwipeControls={false}
        showPlaybackControls={false}
        playbackControlsAvailable={false}
        onTogglePlaybackControls={onTogglePlaybackControls}
        frontTextSlot={<div>Front</div>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));

    const swipeToggle = screen.getByRole("button", { name: "Swipe controls" });
    expect(swipeToggle).toHaveAttribute("aria-pressed", "false");
    expect(swipeToggle).toHaveAttribute("title", "Show swipe controls");
    const playbackToggle = screen.getByRole("button", { name: "Playback controls" });
    expect(playbackToggle).toHaveAttribute("aria-disabled", "true");
    expect(playbackToggle).not.toBeDisabled();
    expect(playbackToggle).toHaveAttribute("title", playbackUnavailableDescription);
    expect(playbackToggle).toHaveAccessibleDescription(playbackUnavailableDescription);

    playbackToggle.focus();
    expect(playbackToggle).toHaveFocus();

    fireEvent.click(playbackToggle);
    expect(onTogglePlaybackControls).not.toHaveBeenCalled();
  });

  it("shows only the selected bottom control groups", () => {
    const { rerender } = render(
      <CardPlayer
        {...toolbarProps()}
        showSwipeControls={false}
        controller={{ autoPlay: false, index: 0, numberOfCards: 2 }}
        swipeButtonList={{ onClickLeft: vi.fn() }}
        frontTextSlot={<div>Front</div>}
      />
    );

    expect(screen.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();

    rerender(
      <CardPlayer
        {...toolbarProps()}
        showPlaybackControls={false}
        controller={{ autoPlay: false, index: 0, numberOfCards: 2 }}
        swipeButtonList={{ onClickLeft: vi.fn() }}
        frontTextSlot={<div>Front</div>}
      />
    );

    expect(screen.getByRole("button", { name: "Swipe left" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("ignores horizontal and vertical swipes on the back text", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeUp = vi.fn();
    render(
      <CardPlayer
        {...toolbarProps()}
        showBackText
        backTextSlot={<div>Back</div>}
        onSwipeLeft={onSwipeLeft}
        onSwipeUp={onSwipeUp}
      />
    );
    const back = screen.getByText("Back");

    swipeLeft(back);
    swipeUp(back);

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeUp).not.toHaveBeenCalled();
  });

  it("reports a vertical swipe performed on the front text", () => {
    const onSwipeUp = vi.fn();
    render(
      <CardPlayer
        {...toolbarProps()}
        showSwipeControls={false}
        frontTextSlot={<div>Front</div>}
        onSwipeUp={onSwipeUp}
      />
    );

    swipeUp(screen.getByText("Front"));

    expect(onSwipeUp).toHaveBeenCalledOnce();
  });

  it("treats a primary-button mouse swipe as only a swipe", () => {
    const onSwipeUp = vi.fn();
    const onFrontClick = vi.fn();
    render(
      <CardPlayer
        {...toolbarProps()}
        frontTextSlot={
          <button type="button" onClick={onFrontClick}>
            Front
          </button>
        }
        onSwipeUp={onSwipeUp}
      />
    );
    const front = screen.getByRole("button", { name: "Front" });

    swipeWithMouse(front, { clientX: 24, clientY: 200 }, { clientX: 24, clientY: 20 });
    fireEvent.click(front);

    expect(onSwipeUp).toHaveBeenCalledOnce();
    expect(onFrontClick).not.toHaveBeenCalled();
  });

  it("ignores non-primary mouse drags on the front text", () => {
    const onSwipeUp = vi.fn();
    render(<CardPlayer {...toolbarProps()} frontTextSlot={<div>Front</div>} onSwipeUp={onSwipeUp} />);
    const front = screen.getByText("Front");

    swipeWithMouse(front, { clientX: 24, clientY: 200 }, { clientX: 24, clientY: 20 }, 1);
    swipeWithMouse(front, { clientX: 24, clientY: 200 }, { clientX: 24, clientY: 20 }, 2);

    expect(onSwipeUp).not.toHaveBeenCalled();
  });

  it("keeps a mouse drag from swiping or clicking the back text", () => {
    const onSwipeLeft = vi.fn();
    const onBackClick = vi.fn();
    render(
      <CardPlayer
        {...toolbarProps()}
        showBackText
        backTextSlot={
          <button type="button" onClick={onBackClick}>
            Back
          </button>
        }
        onSwipeLeft={onSwipeLeft}
      />
    );
    const back = screen.getByRole("button", { name: "Back" });

    swipeWithMouse(back, { clientX: 200, clientY: 24 }, { clientX: 20, clientY: 24 });
    fireEvent.click(back);

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onBackClick).not.toHaveBeenCalled();
  });
});
