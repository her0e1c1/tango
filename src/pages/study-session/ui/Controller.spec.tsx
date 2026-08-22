import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Controller } from "./Controller";

describe("Controller", () => {
  it("delegates autoplay toggles", () => {
    const onToggleAutoPlay = vi.fn();
    render(<Controller autoPlay={false} onToggleAutoPlay={onToggleAutoPlay} />);

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    expect(onToggleAutoPlay).toHaveBeenCalledOnce();
  });

  it("reflects the controlled autoplay value", () => {
    const { rerender } = render(<Controller autoPlay={false} />);

    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute("type", "button");

    rerender(<Controller autoPlay />);

    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("supports native keyboard activation", async () => {
    const user = userEvent.setup();
    const onToggleAutoPlay = vi.fn();
    render(<Controller autoPlay={false} onToggleAutoPlay={onToggleAutoPlay} />);

    screen.getByRole("button", { name: "Play" }).focus();
    await user.keyboard("{Enter}");

    expect(onToggleAutoPlay).toHaveBeenCalledOnce();
  });

  it("delegates manual index changes", () => {
    const onChange = vi.fn();
    render(<Controller onChange={onChange} index={0} numberOfCards={5} />);

    fireEvent.change(screen.getByRole("slider"), { target: { value: 3 } });

    expect(onChange).toHaveBeenCalledWith(3);
  });
});
