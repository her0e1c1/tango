import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Controller } from "./Controller";

describe("NAVIGATION-15 NAVIGATION-16 Controller", () => {
  it("delegates autoplay toggles", () => {
    // Given: Prepare `onToggleAutoPlay` and any shared test state below.
    const onToggleAutoPlay = vi.fn();
    render(<Controller autoPlay={false} onToggleAutoPlay={onToggleAutoPlay} />);

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    // Then: Verify the expected result in the assertions below.
    expect(onToggleAutoPlay).toHaveBeenCalledOnce();
  });

  it("reflects the controlled autoplay value", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    const { rerender } = render(<Controller autoPlay={false} />);

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute("type", "button");

    // When: Exercise `rerender` with the prepared inputs.
    rerender(<Controller autoPlay />);

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("supports native keyboard activation", async () => {
    // Given: Prepare `user`, `onToggleAutoPlay` and any shared test state below.
    const user = userEvent.setup();
    const onToggleAutoPlay = vi.fn();
    render(<Controller autoPlay={false} onToggleAutoPlay={onToggleAutoPlay} />);

    screen.getByRole("button", { name: "Play" }).focus();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Enter}");

    // Then: Verify the expected result in the assertions below.
    expect(onToggleAutoPlay).toHaveBeenCalledOnce();
  });

  it("delegates manual index changes", () => {
    // Given: Prepare `onChange` and any shared test state below.
    const onChange = vi.fn();
    render(<Controller onChange={onChange} index={0} numberOfCards={5} />);

    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(screen.getByRole("slider"), { target: { value: 3 } });

    // Then: Verify the expected result in the assertions below.
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
