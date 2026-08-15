/**
 * @file Verifies the "Controller with useStudyControllerState" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "delegates the auto-play
 * toggle to the controlled callback", "advances the index after the configured interval while
 * playing", "reflects a rerendered controlled autoPlay value immediately".
 */

import type React from "react";

import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Controller, type ControllerProps } from "../components/Controller";
import { useStudyControllerState } from "./useStudyControllerState";

/**
 * Renders the test-only Controller Harness component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const ControllerHarness: React.FC<ControllerProps> = (props) => {
  const controller = useStudyControllerState(props);
  return <Controller {...controller} />;
};

describe("Controller with useStudyControllerState", () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("delegates the auto-play toggle to the controlled callback", () => {
    const onToggleAutoPlay = vi.fn();
    render(<ControllerHarness autoPlay={false} onToggleAutoPlay={onToggleAutoPlay} />);

    fireEvent.click(screen.getByTestId("play"));

    expect(onToggleAutoPlay).toHaveBeenCalledOnce();
    expect(screen.getByTestId("play")).toBeInTheDocument();
  });

  it("advances the index after the configured interval while playing", () => {
    const onChange = vi.fn();
    render(<ControllerHarness onChange={onChange} autoPlay index={0} numberOfCards={5} cardInterval={1} />);
    expect(screen.getByRole("slider")).toHaveValue("0");

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("reflects a rerendered controlled autoPlay value immediately", () => {
    const { rerender } = render(<ControllerHarness autoPlay={false} />);

    rerender(<ControllerHarness autoPlay />);
    expect(screen.getByTestId("pause")).toBeInTheDocument();
  });

  it("updates the index manually", () => {
    const onChange = vi.fn();
    render(<ControllerHarness onChange={onChange} autoPlay={false} index={0} numberOfCards={5} cardInterval={1} />);

    fireEvent.change(screen.getByRole("slider"), { target: { value: 3 } });
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("stops autoplay on the last Card without advancing to an invalid index", () => {
    const onChange = vi.fn();
    const onStopAutoPlay = vi.fn();
    const LastCardHarness = () => {
      const controller = useStudyControllerState({
        onChange,
        onStopAutoPlay,
        autoPlay: true,
        index: 4,
        numberOfCards: 5,
        cardInterval: 1,
      });
      return <Controller {...controller} />;
    };
    render(<LastCardHarness />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(onStopAutoPlay).toHaveBeenCalledOnce();
  });

  it("uses the same terminal behavior for a one-Card session", () => {
    const onChange = vi.fn();
    const onStopAutoPlay = vi.fn();
    const OneCardHarness = () => {
      const controller = useStudyControllerState({
        onChange,
        onStopAutoPlay,
        autoPlay: true,
        index: 0,
        numberOfCards: 1,
        cardInterval: 1,
      });
      return <Controller {...controller} />;
    };
    render(<OneCardHarness />);

    act(() => vi.advanceTimersByTime(1000));
    expect(onChange).not.toHaveBeenCalled();
    expect(onStopAutoPlay).toHaveBeenCalledOnce();
  });
});
