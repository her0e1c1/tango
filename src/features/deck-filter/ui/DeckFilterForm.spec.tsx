/**
 * @file Verifies the "DeckFilterForm" contract with automated examples.
 * The examples make the expected behavior concrete for score controls, callbacks, and unrestricted limits.
 */

import { render, within, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckFilterForm } from "./DeckFilterForm";

type DeckFilterFormProps = ComponentProps<typeof DeckFilterForm>;

/**
 * Provides the create props test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createProps = (): DeckFilterFormProps => ({
  scoreMax: 4,
  scoreMin: -2,
  tags: ["one", "two"],
  selectedTags: ["one"],
  tagAndFilter: true,
  clearScoreRange: vi.fn(),
  setScoreMax: vi.fn(),
  setScoreMin: vi.fn(),
  setSelectedTags: vi.fn(),
  setTagAndFilter: vi.fn(),
});

describe("DeckFilterForm", () => {
  it("composes score and tag filters and preserves callbacks", async () => {
    const props = createProps();
    render(<DeckFilterForm {...props} />);
    const scoreRegion = screen.getByRole("region", { name: "Score range" });
    const maximum = within(scoreRegion).getByRole("combobox", { name: "Maximum score" });
    const minimum = within(scoreRegion).getByRole("combobox", { name: "Minimum score" });

    expect(maximum).toHaveValue("4");
    expect(minimum).toHaveValue("-2");

    await userEvent.selectOptions(maximum, "5");
    await userEvent.selectOptions(minimum, "-3");

    expect(props.setScoreMax).toHaveBeenCalledWith(5);
    expect(props.setScoreMin).toHaveBeenCalledWith(-3);
    await userEvent.click(within(scoreRegion).getByRole("button", { name: "Clear limits" }));
    expect(props.clearScoreRange).toHaveBeenCalledOnce();
    expect(screen.getByRole("region", { name: "Tags" })).toBeInTheDocument();
  });

  it("shows unrestricted limits", () => {
    render(<DeckFilterForm {...createProps()} scoreMax={null} scoreMin={null} />);
    const scoreRegion = screen.getByRole("region", { name: "Score range" });
    expect(within(scoreRegion).queryByRole("button", { name: "Clear limits" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Maximum score" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Minimum score" })).toHaveValue("");
  });
});
