/**
 * @file Verifies the "CardForm" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "groups front, back, tags,
 * and card information while preserving values and callbacks", "uses unique section heading
 * relationships for each form instance", "associates validation errors with their named controls".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { CardForm, type CardFormProps } from "./CardForm";
import { createCard } from "@/test/factories";

const createdAt = Date.UTC(2026, 0, 2);
const lastSeenAt = Date.UTC(2026, 1, 3);

/**
 * Provides the create props test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createProps = (overrides: Partial<CardFormProps> = {}): CardFormProps => ({
  card: createCard({
    id: "card-123",
    frontText: "What is the capital of Japan?",
    backText: "Tokyo",
    tags: ["geography"],
    uniqueKey: "japan-capital",
    createdAt,
    lastSeenAt,
  }),
  fields: {
    frontText: { name: "frontText", value: "What is the capital of Japan?", onChange: vi.fn() },
    backText: { name: "backText", value: "Tokyo", onChange: vi.fn() },
    tags: [
      {
        label: "Geography",
        value: "geography",
        input: { name: "tags", value: "geography", checked: true, onChange: vi.fn() },
      },
      {
        label: "Travel",
        value: "travel",
        input: { name: "tags", value: "travel", checked: false, onChange: vi.fn() },
      },
    ],
  },
  ...overrides,
});

describe("CardForm", () => {
  it("groups front, back, tags, and card information while preserving values and callbacks", async () => {
    const props = createProps();
    render(<CardForm {...props} />);
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    const backText = screen.getByRole("textbox", { name: "Back text" });
    const geography = screen.getByRole("checkbox", { name: "Geography" });
    const travel = screen.getByRole("checkbox", { name: "Travel" });

    expect(screen.getByRole("heading", { level: 2, name: "Front" })).toBeVisible();
    expect(screen.getByText("The prompt shown during study.")).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Back" })).toBeVisible();
    expect(screen.getByText("The answer revealed after the prompt.")).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Tags" })).toBeVisible();
    expect(screen.getByText("Organize this card for filtering and study sessions.")).toBeVisible();
    expect(screen.getByText("Card information")).toBeVisible();
    expect(frontText).toHaveValue("What is the capital of Japan?");
    expect(backText).toHaveValue("Tokyo");
    expect(geography).toBeChecked();
    expect(travel).not.toBeChecked();
    expect(screen.getByText("japan-capital")).toBeInTheDocument();
    expect(screen.getByText("card-123")).toBeInTheDocument();
    expect(screen.getByText(new Date(createdAt).toLocaleDateString())).toBeInTheDocument();
    expect(screen.getByText(new Date(lastSeenAt).toLocaleDateString())).toBeInTheDocument();

    fireEvent.change(frontText, { target: { value: "Updated front" } });
    fireEvent.change(backText, { target: { value: "Updated back" } });
    await userEvent.click(travel);

    expect(props.fields.frontText.onChange).toHaveBeenCalledOnce();
    expect(props.fields.backText.onChange).toHaveBeenCalledOnce();
    expect(props.fields.tags.find((field) => field.value === "travel")?.input.onChange).toHaveBeenCalledOnce();
  });

  it("uses unique section heading relationships for each form instance", () => {
    render(
      <>
        <CardForm {...createProps()} />
        <CardForm {...createProps()} />
      </>
    );
    for (const name of ["Front", "Back", "Tags"]) {
      expect(screen.getAllByRole("region", { name })).toHaveLength(2);
      expect(screen.getAllByRole("heading", { level: 2, name })).toHaveLength(2);
    }
  });

  it("associates validation errors with their named controls", () => {
    render(
      <CardForm
        {...createProps({
          errors: { frontText: "Front text is required.", backText: "Back text is required." },
        })}
      />
    );

    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveAccessibleDescription("Front text is required.");
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveAccessibleDescription("Back text is required.");
  });

  it("keeps cancel separate from submission while idle", async () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn((event?: React.FormEvent) => event?.preventDefault());
    render(<CardForm {...createProps({ isSubmitting: false, onCancel, onSubmit })} />);
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const save = screen.getByRole("button", { name: "Save changes" });

    expect(save).toBeEnabled();
    await userEvent.click(cancel);

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.click(save);

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("disables Save changes and shows pending copy only while submitting", () => {
    render(<CardForm {...createProps({ isSubmitting: true })} />);

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  });
});
