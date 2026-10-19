import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { Upload } from "./Upload";

describe("Upload [DECK-IMPORT-01 DECK-IMPORT-11 DECK-IMPORT-20]", () => {
  it("forwards the same file on every selection while keeping the displayed name and focus", async () => {
    // Given: Prepare `user`, `onChange`, `file` and any shared test state below.
    const user = userEvent.setup();
    const onChange = vi.fn();
    const file = new File(["front,back,,key"], "deck.csv", { type: "text/csv" });
    render(<Upload fileName={file.name} onChange={onChange} />);
    const input = screen.getByLabelText(/Upload a csv file/);

    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(input).toHaveFocus();
    // When: Exercise `user.upload` with the prepared inputs.
    await user.upload(input, file);
    await user.upload(input, file);
    await user.upload(input, file);

    // Then: Verify the expected result in the assertions below.
    expect(onChange.mock.calls).toEqual([[file], [file], [file]]);
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(screen.getByText(file.name)).toBeVisible();
  });

  it("keeps the selection when the picker is cancelled and ignores an empty change", async () => {
    // Given: Prepare `onChange`, `input` and any shared test state below.
    const onChange = vi.fn();
    render(<Upload fileName="deck.csv" onChange={onChange} />);
    const input = screen.getByLabelText(/Upload a csv file/);

    fireEvent(input, new Event("cancel", { bubbles: true }));
    // When: Exercise `userEvent.upload` with the prepared inputs.
    await userEvent.upload(input, []);

    // Then: Verify the expected result in the assertions below.
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("deck.csv")).toBeVisible();
  });

  it("does not select files while disabled", async () => {
    // Given: Prepare `onChange`, `input` and any shared test state below.
    const onChange = vi.fn();
    render(<Upload disabled onChange={onChange} />);
    const input = screen.getByLabelText("Upload a csv file");

    // When: Exercise `userEvent.upload` with the prepared inputs.
    await userEvent.upload(input, new File(["front,back,,key"], "deck.csv", { type: "text/csv" }));

    // Then: Verify the expected result in the assertions below.
    expect(input).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
