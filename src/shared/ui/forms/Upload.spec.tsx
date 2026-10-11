import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { Upload } from "./Upload";

describe("Upload [DECK-IMPORT-01 DECK-IMPORT-11]", () => {
  it("forwards the same file on every selection while keeping the displayed name and focus", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const file = new File(["front,back,,key"], "deck.csv", { type: "text/csv" });
    render(<Upload fileName={file.name} onChange={onChange} />);
    const input = screen.getByLabelText(/Upload a csv file/);

    await user.tab();
    expect(input).toHaveFocus();
    await user.upload(input, file);
    await user.upload(input, file);
    await user.upload(input, file);

    expect(onChange.mock.calls).toEqual([[file], [file], [file]]);
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(screen.getByText(file.name)).toBeVisible();
  });

  it("keeps the selection when the picker is cancelled and ignores an empty change", async () => {
    const onChange = vi.fn();
    render(<Upload fileName="deck.csv" onChange={onChange} />);
    const input = screen.getByLabelText(/Upload a csv file/);

    fireEvent(input, new Event("cancel", { bubbles: true }));
    await userEvent.upload(input, []);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("deck.csv")).toBeVisible();
  });

  it("does not select files while disabled", async () => {
    const onChange = vi.fn();
    render(<Upload disabled onChange={onChange} />);
    const input = screen.getByLabelText("Upload a csv file");

    await userEvent.upload(input, new File(["front,back,,key"], "deck.csv", { type: "text/csv" }));

    expect(input).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
