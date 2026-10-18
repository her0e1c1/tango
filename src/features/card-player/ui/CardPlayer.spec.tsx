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

describe("CardPlayer [STUDY-CONTROLS-05] [STUDY-CONTROLS-06] [STUDY-CONTROLS-07] [STUDY-ACTIONS-01] [STUDY-CONTROLS-04] [NAVIGATION-14]", () => {
  it("ignores reading gestures and their trailing click while keeping explicit buttons active", () => {
    // Given: Prepare `props`, `onSwipeUp`, `onSwipeLeft` and any shared test state below.
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
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(front);
    // Then: Verify the expected result in the assertions below.
    expect(onSwipeUp).not.toHaveBeenCalled();
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(props.onToggleViewMode).not.toHaveBeenCalled();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Swipe left" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSwipeLeft).toHaveBeenCalledOnce();
  });

  it("keeps view mode active while the front text has a selection", () => {
    // Given: Prepare `props`, `text`, `selection` and any shared test state below.
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
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(text);
    // Then: Verify the expected result in the assertions below.
    expect(props.onToggleViewMode).not.toHaveBeenCalled();
    // When: Exercise `selection.removeAllRanges` with the prepared inputs.
    selection.removeAllRanges();
    fireEvent.click(text);
    // Then: Verify the expected result in the assertions below.
    expect(props.onToggleViewMode).toHaveBeenCalledOnce();
  });

  it("exits reading on a tap, but reserves Space for scrolling", () => {
    // Given: Prepare `props`, `region` and any shared test state below.
    const props = toolbarProps();
    render(<CardPlayer {...props} viewMode frontTextSlot={<div>Long front</div>} />);
    const region = screen.getByRole("region", { name: "Card front text" });
    expect(region).toHaveFocus();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(region, { key: " " });
    fireEvent.keyUp(region, { key: " " });
    // Then: Verify the expected result in the assertions below.
    expect(props.onToggleViewMode).not.toHaveBeenCalled();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByText("Long front"));
    // Then: Verify the expected result in the assertions below.
    expect(props.onToggleViewMode).toHaveBeenCalledTimes(1);
  });

  it("keeps the reading preference from changing answer gestures", () => {
    // Given: Prepare `onSwipeLeft`, `onAnswerClick` and any shared test state below.
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
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByText("Answer"));
    // Then: Verify the expected result in the assertions below.
    expect(onAnswerClick).toHaveBeenCalledOnce();
    // When: Exercise `swipeLeft` with the prepared inputs.
    swipeLeft(screen.getByText("Answer"));
    // Then: Verify the expected result in the assertions below.
    expect(onSwipeLeft).toHaveBeenCalledOnce();
  });

  it("uses the edit shortcut slot to toggle visibility only while actions are open", async () => {
    // Given: Use this case's inputs and any shared test setup.
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
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Open card actions" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("link", { name: "Edit current card" })).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Edit link" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(toggle);
    // Then: Verify the expected result in the assertions below.
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    // When: Exercise `userEvent.keyboard` with the prepared inputs.
    await userEvent.keyboard("{Escape}");
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Open card actions" })).toHaveFocus();
    expect(screen.queryByRole("link", { name: "Edit current card" })).not.toBeInTheDocument();
    // When: Exercise `userEvent.keyboard` with the prepared inputs.
    await userEvent.keyboard("{Enter}");
    await userEvent.click(screen.getByRole("button", { name: "Edit link" }));
    await userEvent.keyboard("{Escape}");
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("link", { name: "Edit current card" })).toBeVisible();
  });

  it("hides the edit link on the answer and does not add editing to Study", () => {
    // Given: Prepare `props`, `view` and any shared test state below.
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
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button", { name: "Edit link" })).not.toBeInTheDocument();
  });

  it("shows only the answer on the back", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
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

    // Then: Verify the expected result in the assertions below.
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
    // Given: Prepare `onBackClick`, `onClickLeft`, `onClickRight` and any shared test state below.
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

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Swipe left" }));
    fireEvent.click(screen.getByRole("button", { name: "Swipe right" }));

    // Then: Verify the expected result in the assertions below.
    expect(onClickLeft).toHaveBeenCalledOnce();
    expect(onClickRight).toHaveBeenCalledOnce();
    expect(onBackClick).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Swipe up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe down" })).not.toBeInTheDocument();

    // When: Exercise `rerender` with the prepared inputs.
    rerender(
      <CardPlayer
        {...toolbarProps()}
        showSwipeControls={false}
        frontTextSlot={<div>Front</div>}
        backTextOverlay={{ onClickLeft, onClickRight }}
      />
    );
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe right" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Study answer" })).not.toBeInTheDocument();
  });

  it("forwards edge wheel input to answer scrolling without running the action", () => {
    // Given: Prepare `onClickLeft`, `answerSurface`, `leftOverlay` and any shared test state below.
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

    // When: Evaluate `fireEvent.wheel` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(fireEvent.wheel(leftOverlay, { deltaY: 64, deltaMode: 0 })).toBe(false);

    expect(answerSurface.scrollTop).toBe(64);
    expect(leftOverlay).toHaveClass("touch-pan-y");
    expect(onClickLeft).not.toHaveBeenCalled();
  });

  it("STUDY-CONTROLS-05 keeps Help available while opening the remaining study actions", async () => {
    // Given: Prepare `user`, `onBack`, `onToggleCardDetails` and any shared test state below.
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

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(openActions);

    const closeActions = screen.getByRole("button", { name: "Close card actions" });
    const back = screen.getByRole("button", { name: "Back to deck list" });
    const swipeToggle = screen.getByRole("button", { name: "Swipe controls" });
    const playbackToggle = screen.getByRole("button", { name: "Playback controls" });
    const skipToggle = screen.getByRole("button", { name: "Skip control" });
    const detailsToggle = screen.getByRole("button", { name: "Card details" });
    const helpToggle = screen.getByRole("button", { name: "Help button" });
    const actions = screen.getByRole("group", { name: "Card actions" });
    // Then: Verify the expected result in the assertions below.
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

    // When: Exercise `closeActions.focus` with the prepared inputs.
    closeActions.focus();
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(helpToggle).toHaveFocus();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(back);
    fireEvent.click(swipeToggle);
    fireEvent.click(playbackToggle);
    fireEvent.click(skipToggle);
    fireEvent.click(detailsToggle);

    // Then: Verify the expected result in the assertions below.
    expect(onBack).toHaveBeenCalledOnce();
    expect(onToggleSwipeControls).toHaveBeenCalledOnce();
    expect(onTogglePlaybackControls).toHaveBeenCalledOnce();
    expect(onToggleSkipControls).toHaveBeenCalledOnce();
    expect(onToggleCardDetails).toHaveBeenCalledOnce();

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(helpToggle, { key: "Escape" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Open card actions" })).toHaveFocus();
    expect(screen.queryByRole("group", { name: "Card actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open study help" })).toBeVisible();
  });

  it("STUDY-CONTROLS-05 keeps the Help visibility toggle mounted while visibility changes", () => {
    // Given: Prepare `onToggleHelp`, `props` and any shared test state below.
    const onToggleHelp = vi.fn();
    const props = toolbarProps();
    const { rerender } = render(<CardPlayer {...props} onToggleHelp={onToggleHelp} frontTextSlot={<div>Front</div>} />);

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));

    const actions = screen.getByRole("group", { name: "Card actions" });
    const helpToggle = screen.getByRole("button", { name: "Help button" });
    // Then: Verify the expected result in the assertions below.
    expect(actions).not.toContainElement(helpToggle);
    expect(helpToggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("toolbar-shortcuts")).toContainElement(screen.getByRole("button", { name: "View mode" }));
    expect(screen.getByTestId("toolbar-shortcuts")).toContainElement(
      screen.getByRole("button", { name: /card actions/ })
    );

    // When: Exercise `rerender` with the prepared inputs.
    rerender(<CardPlayer {...props} showHelp={false} onToggleHelp={onToggleHelp} frontTextSlot={<div>Front</div>} />);

    const hiddenHelpToggle = screen.getByRole("button", { name: "Help button" });
    // Then: Verify the expected result in the assertions below.
    expect(hiddenHelpToggle).toBe(helpToggle);
    expect(hiddenHelpToggle).toHaveAttribute("aria-pressed", "false");
    expect(hiddenHelpToggle).toHaveAttribute("title", "Show help button");
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(hiddenHelpToggle);
    // Then: Verify the expected result in the assertions below.
    expect(onToggleHelp).toHaveBeenCalledOnce();
  });

  it("places view mode on the toolbar to the left of the Help icon and toggles it on and off", () => {
    // Given: Prepare `onToggleViewMode`, `props`, `viewModeButton` and any shared test state below.
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

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(viewModeButton);
    // Then: Verify the expected result in the assertions below.
    expect(onToggleViewMode).toHaveBeenCalledOnce();

    // When: Exercise `rerender` with the prepared inputs.
    rerender(
      <CardPlayer {...props} viewMode={true} onToggleViewMode={onToggleViewMode} frontTextSlot={<div>Front</div>} />
    );
    // Then: Verify the expected result in the assertions below.
    expect(viewModeButton).toHaveAttribute("aria-pressed", "true");
    expect(viewModeButton).toHaveAttribute("title", "Exit view mode");
    expect(viewModeButton).toHaveClass("bg-surface-muted", "text-accent-primary");

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));
    // Then: Verify the expected result in the assertions below.
    expect(viewModeButton).toBeVisible();
    const actions = screen.getByRole("group", { name: "Card actions" });
    expect(actions).not.toContainElement(viewModeButton);

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(viewModeButton);
    // Then: Verify the expected result in the assertions below.
    expect(props.onToggleShowViewMode).toHaveBeenCalledOnce();
    // When: Exercise `rerender` with the prepared inputs.
    rerender(<CardPlayer {...props} viewMode showViewMode={false} frontTextSlot={<div>Front</div>} />);
    // Then: Verify the expected result in the assertions below.
    expect(viewModeButton).toHaveAttribute("aria-pressed", "false");
    expect(viewModeButton).toHaveAttribute("title", "Show view mode button");
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Close card actions" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button", { name: "View mode" })).not.toBeInTheDocument();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));
    const visibilityButton = screen.getByRole("button", { name: "View mode" });
    fireEvent.click(visibilityButton);
    // Then: Verify the expected result in the assertions below.
    expect(props.onToggleShowViewMode).toHaveBeenCalledTimes(2);
    // When: Exercise `rerender` with the prepared inputs.
    rerender(<CardPlayer {...props} viewMode frontTextSlot={<div>Front</div>} />);
    fireEvent.click(screen.getByRole("button", { name: "Close card actions" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "View mode" })).toHaveAttribute("title", "Exit view mode");
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));

    // Then: Verify the expected result in the assertions below.
    expect(onToggleViewMode).toHaveBeenCalledOnce();

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(screen.getByRole("button", { name: "View mode" }), { key: "Escape" });
    // Then: Verify the expected result in the assertions below.
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
    // Given: Prepare `trigger`, `shortcuts` and any shared test state below.
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

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    // Then: Verify the expected result in the assertions below.
    expect(
      within(shortcuts)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Close card actions", "Help button", "View mode", "Edit link"]);
    expect(within(shortcuts).queryByRole("link")).not.toBeInTheDocument();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(within(shortcuts).getByRole("button", { name: "Edit link" }), { key: "Escape" });
    // Then: Verify the expected result in the assertions below.
    expect(trigger).toHaveFocus();
    expect(within(shortcuts).queryAllByRole("button")).toHaveLength(1 + Number(showHelp) + Number(showViewMode));
    expect(within(shortcuts).queryAllByRole("link")).toHaveLength(Number(showEdit));
  });

  it("shows and hides all card details from the persisted preference value", () => {
    // Given: Use this case's inputs and any shared test setup.
    const { rerender } = render(
      <CardPlayer
        {...toolbarProps()}
        cardOverlaySlot={<div>Difficulty, seen count, and last seen</div>}
        frontTextSlot={<div>Front</div>}
      />
    );

    expect(screen.getByText("Difficulty, seen count, and last seen")).toBeVisible();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));

    rerender(
      <CardPlayer
        {...toolbarProps()}
        showCardDetails={false}
        cardOverlaySlot={<div>Difficulty, seen count, and last seen</div>}
        frontTextSlot={<div>Front</div>}
      />
    );
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("title", "Show card details");
    expect(screen.queryByText("Difficulty, seen count, and last seen")).not.toBeInTheDocument();

    // When: Exercise `rerender` with the prepared inputs.
    rerender(
      <CardPlayer
        {...toolbarProps()}
        cardOverlaySlot={<div>Difficulty, seen count, and last seen</div>}
        frontTextSlot={<div>Front</div>}
      />
    );
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("title", "Hide card details");
    expect(screen.getByText("Difficulty, seen count, and last seen")).toBeVisible();
  });

  it("describes hidden controls and keeps the unavailable playback toggle disabled", () => {
    // Given: Prepare `onTogglePlaybackControls` and any shared test state below.
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

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open card actions" }));

    const swipeToggle = screen.getByRole("button", { name: "Swipe controls" });
    // Then: Verify the expected result in the assertions below.
    expect(swipeToggle).toHaveAttribute("aria-pressed", "false");
    expect(swipeToggle).toHaveAttribute("title", "Show swipe controls");
    const playbackToggle = screen.getByRole("button", { name: "Playback controls" });
    expect(playbackToggle).toHaveAttribute("aria-disabled", "true");
    expect(playbackToggle).not.toBeDisabled();
    expect(playbackToggle).toHaveAttribute("title", playbackUnavailableDescription);
    expect(playbackToggle).toHaveAccessibleDescription(playbackUnavailableDescription);

    // When: Exercise `playbackToggle.focus` with the prepared inputs.
    playbackToggle.focus();
    // Then: Verify the expected result in the assertions below.
    expect(playbackToggle).toHaveFocus();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(playbackToggle);
    // Then: Verify the expected result in the assertions below.
    expect(onTogglePlaybackControls).not.toHaveBeenCalled();
  });

  it("shows only the selected bottom control groups", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    const { rerender } = render(
      <CardPlayer
        {...toolbarProps()}
        showSwipeControls={false}
        controller={{ autoPlay: false, index: 0, numberOfCards: 2 }}
        swipeButtonList={{ onClickLeft: vi.fn() }}
        frontTextSlot={<div>Front</div>}
      />
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();

    // When: Exercise `rerender` with the prepared inputs.
    rerender(
      <CardPlayer
        {...toolbarProps()}
        showPlaybackControls={false}
        controller={{ autoPlay: false, index: 0, numberOfCards: 2 }}
        swipeButtonList={{ onClickLeft: vi.fn() }}
        frontTextSlot={<div>Front</div>}
      />
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Swipe left" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("ignores horizontal and vertical swipes on the back text", () => {
    // Given: Prepare `onSwipeLeft`, `onSwipeUp`, `back` and any shared test state below.
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
    // When: Exercise `swipeUp` with the prepared inputs.
    swipeUp(back);

    // Then: Verify the expected result in the assertions below.
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeUp).not.toHaveBeenCalled();
  });

  it("reports a vertical swipe performed on the front text", () => {
    // Given: Prepare `onSwipeUp` and any shared test state below.
    const onSwipeUp = vi.fn();
    render(
      <CardPlayer
        {...toolbarProps()}
        showSwipeControls={false}
        frontTextSlot={<div>Front</div>}
        onSwipeUp={onSwipeUp}
      />
    );

    // When: Exercise `swipeUp` with the prepared inputs.
    swipeUp(screen.getByText("Front"));

    // Then: Verify the expected result in the assertions below.
    expect(onSwipeUp).toHaveBeenCalledOnce();
  });

  it("treats a primary-button mouse swipe as only a swipe", () => {
    // Given: Prepare `onSwipeUp`, `onFrontClick`, `front` and any shared test state below.
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
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(front);

    // Then: Verify the expected result in the assertions below.
    expect(onSwipeUp).toHaveBeenCalledOnce();
    expect(onFrontClick).not.toHaveBeenCalled();
  });

  it("ignores non-primary mouse drags on the front text", () => {
    // Given: Prepare `onSwipeUp`, `front` and any shared test state below.
    const onSwipeUp = vi.fn();
    render(<CardPlayer {...toolbarProps()} frontTextSlot={<div>Front</div>} onSwipeUp={onSwipeUp} />);
    const front = screen.getByText("Front");

    // When: Exercise `swipeWithMouse` with the prepared inputs.
    swipeWithMouse(front, { clientX: 24, clientY: 200 }, { clientX: 24, clientY: 20 }, 1);
    swipeWithMouse(front, { clientX: 24, clientY: 200 }, { clientX: 24, clientY: 20 }, 2);

    // Then: Verify the expected result in the assertions below.
    expect(onSwipeUp).not.toHaveBeenCalled();
  });

  it("keeps a mouse drag from swiping or clicking the back text", () => {
    // Given: Prepare `onSwipeLeft`, `onBackClick`, `back` and any shared test state below.
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
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(back);

    // Then: Verify the expected result in the assertions below.
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onBackClick).not.toHaveBeenCalled();
  });
});
