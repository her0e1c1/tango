import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { StudySession } from "./StudySession";

const playbackUnavailableDescription = "Playback controls unavailable because the card interval is set to 0";

const toolbarProps = () => ({
  showHelp: true,
  showCardDetails: true,
  showSwipeControls: true,
  showPlaybackControls: true,
  playbackControlsAvailable: true,
  onBack: vi.fn(),
  onToggleCardDetails: vi.fn(),
  onToggleHelp: vi.fn(),
  onToggleSwipeControls: vi.fn(),
  onTogglePlaybackControls: vi.fn(),
  help: {
    open: false,
    triggerLabel: "Open study help",
    title: "Study controls",
    description: "Review the current controls.",
    closeLabel: "Close help",
    rows: [{ control: "Arrow Up / Swipe Up", action: "Go to the next card" }],
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

describe("StudySession", () => {
  it("shows only the answer on the back", () => {
    render(
      <StudySession
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
    expect(screen.queryByRole("group", { name: "Study actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open study actions" })).not.toBeInTheDocument();
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
      <StudySession
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
      <StudySession
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
      <StudySession
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

  it("keeps the back action visible and opens the remaining study actions", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onToggleCardDetails = vi.fn();
    const onToggleSwipeControls = vi.fn();
    const onTogglePlaybackControls = vi.fn();
    render(
      <StudySession
        {...toolbarProps()}
        onBack={onBack}
        onToggleCardDetails={onToggleCardDetails}
        onToggleSwipeControls={onToggleSwipeControls}
        onTogglePlaybackControls={onTogglePlaybackControls}
        cardOverlaySlot={<div>Card metadata</div>}
        frontTextSlot={<div>Front</div>}
      />
    );

    const openActions = screen.getByRole("button", { name: "Open study actions" });
    expect(openActions).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "Study actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open study help" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Back to deck list" })).toBeVisible();

    fireEvent.click(openActions);

    const closeActions = screen.getByRole("button", { name: "Close study actions" });
    const back = screen.getByRole("button", { name: "Back to deck list" });
    const swipeToggle = screen.getByRole("button", { name: "Swipe controls" });
    const playbackToggle = screen.getByRole("button", { name: "Playback controls" });
    const detailsToggle = screen.getByRole("button", { name: "Card details" });
    const helpToggle = screen.getByRole("button", { name: "Help button" });
    const help = screen.getByRole("button", { name: "Open study help" });
    const actions = screen.getByRole("group", { name: "Study actions" });
    expect(closeActions).toHaveAttribute("aria-expanded", "true");
    expect(back).toBeVisible();
    expect(help).toBeVisible();
    expect(helpToggle).toHaveAttribute("aria-pressed", "true");
    expect(helpToggle).toHaveAttribute("title", "Hide help button");
    expect(swipeToggle).toHaveAttribute("aria-pressed", "true");
    expect(playbackToggle).toHaveAttribute("aria-pressed", "true");
    expect(detailsToggle).toHaveAttribute("aria-pressed", "true");
    expect(swipeToggle).toHaveAttribute("title", "Hide swipe controls");
    expect(playbackToggle).toHaveAttribute("title", "Hide playback controls");
    expect(detailsToggle).toHaveAttribute("title", "Hide card details");
    expect(actions).toContainElement(helpToggle);
    expect(actions).not.toContainElement(help);
    expect(actions).not.toContainElement(back);
    expect(actions).not.toContainElement(screen.getByText("Card metadata"));

    closeActions.focus();
    await user.tab();
    expect(help).toHaveFocus();

    fireEvent.click(back);
    fireEvent.click(swipeToggle);
    fireEvent.click(playbackToggle);
    fireEvent.click(detailsToggle);

    expect(onBack).toHaveBeenCalledOnce();
    expect(onToggleSwipeControls).toHaveBeenCalledOnce();
    expect(onTogglePlaybackControls).toHaveBeenCalledOnce();
    expect(onToggleCardDetails).toHaveBeenCalledOnce();

    fireEvent.keyDown(help, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open study actions" })).toHaveFocus();
    expect(screen.queryByRole("group", { name: "Study actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open study help" })).toBeVisible();
  });

  it("hides the Help shortcut while keeping its Header toggle available", () => {
    const onToggleHelp = vi.fn();
    render(
      <StudySession {...toolbarProps()} showHelp={false} onToggleHelp={onToggleHelp} frontTextSlot={<div>Front</div>} />
    );

    expect(screen.queryByRole("button", { name: "Open study help" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open study actions" }));

    const helpToggle = screen.getByRole("button", { name: "Help button" });
    expect(helpToggle).toHaveAttribute("aria-pressed", "false");
    expect(helpToggle).toHaveAttribute("title", "Show help button");
    fireEvent.click(helpToggle);
    expect(onToggleHelp).toHaveBeenCalledOnce();
  });

  it("shows and hides all card details from the persisted preference value", () => {
    const { rerender } = render(
      <StudySession
        {...toolbarProps()}
        cardOverlaySlot={<div>Score, seen count, and last seen</div>}
        frontTextSlot={<div>Front</div>}
      />
    );

    expect(screen.getByText("Score, seen count, and last seen")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Open study actions" }));

    rerender(
      <StudySession
        {...toolbarProps()}
        showCardDetails={false}
        cardOverlaySlot={<div>Score, seen count, and last seen</div>}
        frontTextSlot={<div>Front</div>}
      />
    );
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("title", "Show card details");
    expect(screen.queryByText("Score, seen count, and last seen")).not.toBeInTheDocument();

    rerender(
      <StudySession
        {...toolbarProps()}
        cardOverlaySlot={<div>Score, seen count, and last seen</div>}
        frontTextSlot={<div>Front</div>}
      />
    );
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Card details" })).toHaveAttribute("title", "Hide card details");
    expect(screen.getByText("Score, seen count, and last seen")).toBeVisible();
  });

  it("describes hidden controls and keeps the unavailable playback toggle disabled", () => {
    const onTogglePlaybackControls = vi.fn();
    render(
      <StudySession
        {...toolbarProps()}
        showSwipeControls={false}
        showPlaybackControls={false}
        playbackControlsAvailable={false}
        onTogglePlaybackControls={onTogglePlaybackControls}
        frontTextSlot={<div>Front</div>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open study actions" }));

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
      <StudySession
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
      <StudySession
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
      <StudySession
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
      <StudySession
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
      <StudySession
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
    render(<StudySession {...toolbarProps()} frontTextSlot={<div>Front</div>} onSwipeUp={onSwipeUp} />);
    const front = screen.getByText("Front");

    swipeWithMouse(front, { clientX: 24, clientY: 200 }, { clientX: 24, clientY: 20 }, 1);
    swipeWithMouse(front, { clientX: 24, clientY: 200 }, { clientX: 24, clientY: 20 }, 2);

    expect(onSwipeUp).not.toHaveBeenCalled();
  });

  it("keeps a mouse drag from swiping or clicking the back text", () => {
    const onSwipeLeft = vi.fn();
    const onBackClick = vi.fn();
    render(
      <StudySession
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
