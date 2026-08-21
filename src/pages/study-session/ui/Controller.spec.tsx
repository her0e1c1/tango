import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { Controller } from "./Controller";

describe("Controller", () => {
  it("delegates autoplay toggles", () => {
    const onToggleAutoPlay = vi.fn();
    render(<Controller autoPlay={false} onToggleAutoPlay={onToggleAutoPlay} />);

    fireEvent.click(screen.getByTestId("play"));

    expect(onToggleAutoPlay).toHaveBeenCalledOnce();
  });

  it("reflects the controlled autoplay value", () => {
    const { rerender } = render(<Controller autoPlay={false} />);

    rerender(<Controller autoPlay />);

    expect(screen.getByTestId("pause")).toBeInTheDocument();
  });

  it("delegates manual index changes", () => {
    const onChange = vi.fn();
    render(<Controller onChange={onChange} index={0} numberOfCards={5} />);

    fireEvent.change(screen.getByRole("slider"), { target: { value: 3 } });

    expect(onChange).toHaveBeenCalledWith(3);
  });
});
