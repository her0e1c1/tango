import React from "react";

import userEvent from "@testing-library/user-event";
import { render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { expect, it, describe, vi, afterEach, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";

import { act } from "react-dom/test-utils";
import { Controller } from "./Controller";

describe.skip("Controller", () => {
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
  it("should update index once a second", async () => {
    const onChange = vi.fn();
    // start with autPlay=false. this is because when calling `render`, should not update component state
    const c = render(<Controller onChange={onChange} autoPlay={false} index={0} numberOfCards={5} cardInterval={1} />);
    expect(c.getByRole("slider")).toHaveValue("0");
    act(() => {
      userEvent.click(c.getByTestId("play"));
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() => {
      expect(onChange).lastCalledWith(1);
    });
  });

  it("should update index manually", async () => {
    const onChange = vi.fn();
    const c = render(<Controller onChange={onChange} autoPlay={false} index={0} numberOfCards={5} cardInterval={1} />);
    expect(c.getByRole("slider")).toHaveValue("0");
    act(() => {
      fireEvent.change(c.getByRole("slider"), { target: { value: 3 } });
    });
    await waitFor(() => {
      expect(onChange).lastCalledWith(3);
    });
  });
});
