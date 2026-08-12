/**
 * @file Verifies the "DeckForm" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "groups editable settings
 * and deck information while preserving field values and callbacks", "uses unique section heading
 * relationships for each form instance", "associates validation errors with their named controls".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckForm, type DeckFormProps } from "./DeckForm";
import { createDeck } from "@/test/factories";

/**
 * Provides the create props test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createProps = (overrides: Partial<DeckFormProps> = {}): DeckFormProps => ({
  deck: createDeck({
    id: "deck-123",
    name: "Japanese vocabulary",
    url: "https://example.com/deck.csv",
    category: "language",
    convertToBr: true,
    isPublic: true,
    createdAt: Date.UTC(2026, 0, 2),
    updatedAt: Date.UTC(2026, 1, 3),
  }),
  fields: {
    name: { name: "name", value: "Japanese vocabulary", onChange: vi.fn() },
    convertToBr: { name: "convertToBr", checked: true, onChange: vi.fn() },
    url: { name: "url", value: "https://example.com/deck.csv", onChange: vi.fn() },
    category: {
      name: "category",
      value: "language",
      options: [
        { label: "Language", value: "language" },
        { label: "Science", value: "science" },
      ],
      onChange: vi.fn(),
    },
  },
  ...overrides,
});

describe("DeckForm", () => {
  it("groups editable settings and deck information while preserving field values and callbacks", async () => {
    const props = createProps();
    render(<DeckForm {...props} />);
    const name = screen.getByRole("textbox", { name: "Name" });
    const convertToBr = screen.getByRole("checkbox", { name: "Convert line breaks" });
    const url = screen.getByRole("textbox", { name: "Source URL" });
    const category = screen.getByRole("combobox");

    expect(screen.getByRole("heading", { level: 2, name: "Basic information" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Import & formatting" })).toBeVisible();
    const deckInformation = screen.getByText("Deck information");
    expect(deckInformation).toBeVisible();
    expect(screen.queryByText("Public")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Public" })).not.toBeInTheDocument();
    expect(name).toHaveValue("Japanese vocabulary");
    expect(screen.getByRole("checkbox", { name: "Convert line breaks" })).toBe(convertToBr);
    expect(convertToBr).toBeChecked();
    expect(url).toHaveValue("https://example.com/deck.csv");
    expect(category).toHaveValue("language");
    await userEvent.click(deckInformation);
    expect(screen.getByText("deck-123")).toBeVisible();
    expect(screen.getByText(new Date(Date.UTC(2026, 0, 2)).toLocaleDateString())).toBeVisible();
    expect(screen.getByText(new Date(Date.UTC(2026, 1, 3)).toLocaleDateString())).toBeVisible();

    fireEvent.change(name, { target: { value: "Updated deck" } });
    await userEvent.click(convertToBr);
    fireEvent.change(url, { target: { value: "https://example.com/updated.csv" } });
    await userEvent.selectOptions(category, "science");

    expect(props.fields.name.onChange).toHaveBeenCalledOnce();
    expect(props.fields.convertToBr.onChange).toHaveBeenCalledOnce();
    expect(props.fields.url.onChange).toHaveBeenCalledOnce();
    expect(props.fields.category.onChange).toHaveBeenCalledOnce();
  });

  it("uses unique section heading relationships for each form instance", () => {
    render(
      <>
        <DeckForm {...createProps()} />
        <DeckForm {...createProps()} />
      </>
    );
    for (const name of ["Basic information", "Import & formatting"]) {
      expect(screen.getAllByRole("region", { name })).toHaveLength(2);
      expect(screen.getAllByRole("heading", { level: 2, name })).toHaveLength(2);
    }
  });

  it("associates validation errors with their named controls", () => {
    render(<DeckForm {...createProps({ errors: { name: "Deck name is required.", url: "Enter a valid URL." } })} />);

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAccessibleDescription("Deck name is required.");
    expect(screen.getByRole("textbox", { name: "Source URL" })).toHaveAccessibleDescription("Enter a valid URL.");
  });

  it("submits or cancels from the action row", async () => {
    const onSubmit = vi.fn((event?: React.FormEvent) => event?.preventDefault());
    const onCancel = vi.fn();
    render(<DeckForm {...createProps({ isSubmitting: false, onSubmit, onCancel })} />);
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const save = screen.getByRole("button", { name: "Save changes" });

    await userEvent.click(cancel);
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(save).toBeEnabled();
    await userEvent.click(save);

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("shows a disabled saving action while submitting", () => {
    render(<DeckForm {...createProps({ isSubmitting: true })} />);

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });
});
