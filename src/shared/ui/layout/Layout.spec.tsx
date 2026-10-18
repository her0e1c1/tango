/** @file Verifies the standard and fullscreen application shell behavior. */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { Layout } from "./Layout";

describe("shared app shell", () => {
  it("renders the standard branch in shell order and ignores fullscreen-only interaction props", () => {
    // Given: Prepare `onClick`, `content` and any shared test state below.
    const onClick = vi.fn();
    render(
      <Layout showHeader scroll onClick={onClick}>
        <span>Standard content</span>
      </Layout>
    );
    const content = screen.getByText("Standard content");

    expect(screen.getByText("tango")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Application shell" })).toContainElement(content);
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(content);
    // Then: Verify the expected result in the assertions below.
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders the fullscreen branch without Main or the bottom spacer", () => {
    // Given: Prepare `onClick`, `fullScreen`, `content` and any shared test state below.
    const onClick = vi.fn();
    render(
      <Layout fullscreen showHeader scroll onClick={onClick}>
        <span>Fullscreen content</span>
      </Layout>
    );
    const fullScreen = screen.getByRole("button", { name: /Fullscreen content/ });
    const content = screen.getByText("Fullscreen content");

    expect(fullScreen).toContainElement(content);

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(content);
    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });
});
