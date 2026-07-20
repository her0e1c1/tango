/**
 * @file Verifies the "RemoteMutationNotice" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "shows pending feedback by
 * default", "hides pending feedback when requested", "keeps the error and Retry action when
 * pending feedback is hidden".
 */

import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { RemoteMutationNotice } from "@/components/feedback/RemoteMutationNotice";

describe("RemoteMutationNotice", () => {
  it("shows pending feedback by default", () => {
    const view = render(<RemoteMutationNotice pending error={null} onRetry={vi.fn()} />);

    expect(view.getByRole("status")).toHaveTextContent("Saving…");
  });

  it("hides pending feedback when requested", () => {
    const view = render(<RemoteMutationNotice pending error={null} onRetry={vi.fn()} showPending={false} />);

    expect(view.queryByRole("status")).not.toBeInTheDocument();
    expect(view.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("keeps the error and Retry action when pending feedback is hidden", () => {
    const onRetry = vi.fn();
    const view = render(
      <RemoteMutationNotice pending={false} error={new Error("write failed")} onRetry={onRetry} showPending={false} />
    );

    expect(view.getByRole("alert")).toHaveTextContent("Unable to save changes.");
    fireEvent.click(view.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("uses a custom pending label", () => {
    const view = render(<RemoteMutationNotice pending error={null} onRetry={vi.fn()} pendingLabel="Deleting deck…" />);

    expect(view.getByRole("status")).toHaveTextContent("Deleting deck…");
  });

  it("uses a custom error label", () => {
    const view = render(
      <RemoteMutationNotice
        pending={false}
        error={new Error("delete failed")}
        onRetry={vi.fn()}
        errorLabel="Unable to delete deck."
      />
    );

    expect(view.getByRole("alert")).toHaveTextContent("Unable to delete deck.");
  });
});
