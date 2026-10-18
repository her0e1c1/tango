/** @file Verifies shared content through rendered copy and user interaction. */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { Description, Style, Title } from ".";

describe("shared content hierarchy", () => {
  it("activates an interactive title from the keyboard", () => {
    // Given: Prepare `onClick`, `title` and any shared test state below.
    const onClick = vi.fn();
    render(<Title onClick={onClick}>A continuous-title-that-must-wrap-on-narrow-screens</Title>);
    const title = screen.getByRole("button", { name: /continuous-title/ });
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(title, { key: "Enter" });
    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders descriptions and reports styled text clicks", () => {
    // Given: Prepare `onClick` and any shared test state below.
    const onClick = vi.fn();
    render(
      <>
        <Description label="Description text">Ignored description</Description>
        <Style onClick={onClick}>Styled text</Style>
      </>
    );

    expect(screen.getByText("Description text")).toBeVisible();
    expect(screen.queryByText("Ignored description")).not.toBeInTheDocument();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByText("Styled text"));
    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });
});
