/**
 * @file Verifies the "RemoteMutationNotice" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "shows pending feedback by
 * default", "hides pending feedback when requested", "keeps the error and Retry action when
 * pending feedback is hidden".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { RemoteMutationNotice } from "./RemoteMutationNotice";

describe("RemoteMutationNotice", () => {
  it("shows pending feedback by default", () => {
    render(<RemoteMutationNotice pending error={null} onRetry={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Saving…");
  });

  it("hides pending feedback when requested", () => {
    render(<RemoteMutationNotice pending error={null} onRetry={vi.fn()} showPending={false} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("keeps the error and Retry action when pending feedback is hidden", () => {
    const onRetry = vi.fn();
    render(
      <RemoteMutationNotice pending={false} error={new Error("write failed")} onRetry={onRetry} showPending={false} />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to save changes.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("uses a custom pending label", () => {
    render(<RemoteMutationNotice pending error={null} onRetry={vi.fn()} pendingLabel="Deleting deck…" />);

    expect(screen.getByRole("status")).toHaveTextContent("Deleting deck…");
  });

  it("uses a custom error label", () => {
    render(
      <RemoteMutationNotice
        pending={false}
        error={new Error("delete failed")}
        onRetry={vi.fn()}
        errorLabel="Unable to delete deck."
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to delete deck.");
  });
});
