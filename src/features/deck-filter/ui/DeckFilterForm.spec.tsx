/**
 * @file Verifies the "DeckFilterForm" contract with automated examples.
 * The examples make the expected behavior concrete for difficulty controls, callbacks, and unrestricted limits.
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
  difficultyLowerBound: 1,
  difficultyMax: 4,
  difficultyMin: 3,
  difficultyUpperBound: 10,
  tags: ["one", "two"],
  selectedTags: ["one"],
  tagAndFilter: true,
  clearDifficultyRange: vi.fn(),
  setDifficultyMax: vi.fn(),
  setDifficultyMin: vi.fn(),
  setSelectedTags: vi.fn(),
  setTagAndFilter: vi.fn(),
});

describe("DeckFilterForm [CARD-10]", () => {
  it("composes difficulty and tag filters and preserves callbacks", async () => {
    const props = createProps();
    render(<DeckFilterForm {...props} />);
    const difficultyRegion = screen.getByRole("region", { name: "Difficulty range" });
    const maximum = within(difficultyRegion).getByRole("combobox", { name: "Maximum difficulty" });
    const minimum = within(difficultyRegion).getByRole("combobox", { name: "Minimum difficulty" });

    expect(maximum).toHaveValue("4");
    expect(minimum).toHaveValue("3");

    await userEvent.selectOptions(maximum, "5");
    await userEvent.selectOptions(minimum, "2");

    expect(props.setDifficultyMax).toHaveBeenCalledWith(5);
    expect(props.setDifficultyMin).toHaveBeenCalledWith(2);
    await userEvent.click(within(difficultyRegion).getByRole("button", { name: "Clear limits" }));
    expect(props.clearDifficultyRange).toHaveBeenCalledOnce();
    expect(screen.getByRole("region", { name: "Tags" })).toBeInTheDocument();
  });

  it("shows unrestricted limits", () => {
    render(<DeckFilterForm {...createProps()} difficultyMax={null} difficultyMin={null} />);
    const difficultyRegion = screen.getByRole("region", { name: "Difficulty range" });
    expect(within(difficultyRegion).queryByRole("button", { name: "Clear limits" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Maximum difficulty" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Minimum difficulty" })).toHaveValue("");
  });
});
