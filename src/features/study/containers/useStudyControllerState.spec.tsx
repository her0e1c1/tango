import React from "react";

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Controller, type ControllerProps } from "@src/features/study/components/Controller";
import { useStudyControllerState } from "@src/features/study/containers/useStudyControllerState";

const ControllerHarness: React.FC<ControllerProps> = (props) => {
  const controller = useStudyControllerState(props);
  return <Controller {...controller} />;
};

describe("Controller with useStudyControllerState", () => {
  afterEach(() => {
    cleanup();
  });
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("delegates the auto-play toggle to the controlled callback", () => {
    const onToggleAutoPlay = vi.fn();
    const c = render(<ControllerHarness autoPlay={false} onToggleAutoPlay={onToggleAutoPlay} />);

    fireEvent.click(c.getByTestId("play"));

    expect(onToggleAutoPlay).toHaveBeenCalledOnce();
    expect(c.getByTestId("play")).toBeInTheDocument();
  });

  it("advances the index after the configured interval while playing", () => {
    const onChange = vi.fn();
    const c = render(<ControllerHarness onChange={onChange} autoPlay index={0} numberOfCards={5} cardInterval={1} />);
    expect(c.getByRole("slider")).toHaveValue("0");

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
    const c = render(<ControllerHarness autoPlay={false} />);

    c.rerender(<ControllerHarness autoPlay />);
    expect(c.getByTestId("pause")).toBeInTheDocument();
  });

  it("updates the index manually", () => {
    const onChange = vi.fn();
    const c = render(
      <ControllerHarness onChange={onChange} autoPlay={false} index={0} numberOfCards={5} cardInterval={1} />
    );

    fireEvent.change(c.getByRole("slider"), { target: { value: 3 } });
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("does not advance past the existing terminal index behavior", () => {
    const onChange = vi.fn();
    render(<ControllerHarness onChange={onChange} autoPlay index={5} numberOfCards={5} cardInterval={1} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
