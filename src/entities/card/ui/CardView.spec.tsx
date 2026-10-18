import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { CardView } from "./CardView";

describe("CardView", () => {
  it("renders prepared answer content", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<CardView text="const answer = 42;" category="typescript" code dark />);

    const code = screen.getByText(/answer =/);
    // Then: Verify the expected result in the assertions below.
    expect(code).toHaveTextContent("const answer = 42;");
    expect(code).toHaveAttribute("data-language", "typescript");
    expect(code).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("region", { name: "Card answer" })).toContainElement(code);
  });

  it("supports the bare study layout and click behavior", () => {
    // Given: Prepare `onClick`, `answer` and any shared test state below.
    const onClick = vi.fn();

    render(<CardView text="Card answer" onClick={onClick} variant="bare" />);

    const answer = screen.getByText("Card answer");
    expect(screen.queryByRole("region", { name: "Card answer" })).not.toBeInTheDocument();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(answer);
    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });
});
