import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { StudySession } from "./StudySession";

const playbackUnavailableDescription = "Playback controls unavailable because the card interval is set to 0";

const toolbarProps = () => ({
  showSwipeControls: true,
  showPlaybackControls: true,
  playbackControlsAvailable: true,
  onBack: vi.fn(),
  onToggleSwipeControls: vi.fn(),
  onTogglePlaybackControls: vi.fn(),
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
        feedbackSlot={<div>Save failed</div>}
        swipeFeedback="cardSwipeRight"
        controller={{ autoPlay: false, index: 0, numberOfCards: 2 }}
        swipeButtonList={{ onClickLeft: vi.fn() }}
      />
    );

    expect(screen.getByText("Back")).toBeVisible();
    expect(screen.queryByText("Front")).not.toBeInTheDocument();
    expect(screen.queryByText("Card metadata")).not.toBeInTheDocument();
    expect(screen.queryByText("Save failed")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Study actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to deck list" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe controls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Playback controls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Swipe left" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("reports toolbar actions through accessible controls", () => {
    const onBack = vi.fn();
    const onToggleSwipeControls = vi.fn();
    const onTogglePlaybackControls = vi.fn();
    render(
      <StudySession
        {...toolbarProps()}
        onBack={onBack}
        onToggleSwipeControls={onToggleSwipeControls}
        onTogglePlaybackControls={onTogglePlaybackControls}
        cardOverlaySlot={<div>Card metadata</div>}
        frontTextSlot={<div>Front</div>}
      />
    );

    const back = screen.getByRole("button", { name: "Back to deck list" });
    const swipeToggle = screen.getByRole("button", { name: "Swipe controls" });
    const playbackToggle = screen.getByRole("button", { name: "Playback controls" });
    const actions = screen.getByRole("group", { name: "Study actions" });
    expect(back).toBeVisible();
    expect(swipeToggle).toHaveAttribute("aria-pressed", "true");
    expect(playbackToggle).toHaveAttribute("aria-pressed", "true");
    expect(swipeToggle).toHaveAttribute("title", "Hide swipe controls");
    expect(playbackToggle).toHaveAttribute("title", "Hide playback controls");
    expect(actions).toContainElement(back);
    expect(actions).not.toContainElement(screen.getByText("Card metadata"));

    fireEvent.click(back);
    fireEvent.click(swipeToggle);
    fireEvent.click(playbackToggle);

    expect(onBack).toHaveBeenCalledOnce();
    expect(onToggleSwipeControls).toHaveBeenCalledOnce();
    expect(onTogglePlaybackControls).toHaveBeenCalledOnce();
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
