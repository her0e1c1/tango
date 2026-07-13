import React from "react";

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Controller } from "@src/features/study/components/Controller";
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

  it("toggles play and pause through the hook state", () => {
    const c = render(<ControllerHarness autoPlay={false} />);

    fireEvent.click(c.getByTestId("play"));
    expect(c.getByTestId("pause")).toBeInTheDocument();

    fireEvent.click(c.getByTestId("pause"));
    expect(c.getByTestId("play")).toBeInTheDocument();
  });

  it("advances the index after the configured interval while playing", () => {
    const onChange = vi.fn();
    const c = render(
      <ControllerHarness onChange={onChange} autoPlay={false} index={0} numberOfCards={5} cardInterval={1} />
    );
    expect(c.getByRole("slider")).toHaveValue("0");

    fireEvent.click(c.getByTestId("play"));
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("uses autoPlay only as the initial hook state", () => {
    const c = render(<ControllerHarness autoPlay={false} />);

    c.rerender(<ControllerHarness autoPlay />);
    expect(c.getByTestId("play")).toBeInTheDocument();

    fireEvent.click(c.getByTestId("play"));
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
