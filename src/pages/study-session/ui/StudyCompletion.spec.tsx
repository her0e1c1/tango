import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { StudyCompletion } from "./StudyCompletion";

describe("StudyCompletion", () => {
  it("shows the completed Card count and reports the return action", () => {
    const onClickBack = vi.fn();
    render(<StudyCompletion cardCount={1} onClickBack={onClickBack} />);

    expect(screen.getByRole("heading", { name: "Study complete" })).toHaveFocus();
    expect(screen.getByText("You studied 1 card.")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to deck list" }));
    expect(onClickBack).toHaveBeenCalledOnce();
  });
});
