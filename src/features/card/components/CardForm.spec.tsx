/**
 * @file Verifies the "CardForm" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "groups front, back, tags,
 * and card information while preserving values and callbacks", "uses unique section heading
 * relationships for each form instance", "associates validation errors with their named controls".
 */

import { cleanup, fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { CardForm, type CardFormProps } from "@/features/card/components/CardForm";
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
  afterEach(cleanup);

  it("groups front, back, tags, and card information while preserving values and callbacks", async () => {
    const props = createProps();
    const view = render(<CardForm {...props} />);
    const frontText = view.container.querySelector("textarea[name='frontText']") as HTMLTextAreaElement;
    const backText = view.container.querySelector("textarea[name='backText']") as HTMLTextAreaElement;
    const geography = view.container.querySelector("input[name='tags'][value='geography']") as HTMLInputElement;
    const travel = view.container.querySelector("input[name='tags'][value='travel']") as HTMLInputElement;

    expect(view.getByRole("heading", { level: 2, name: "Front" })).toBeVisible();
    expect(view.getByText("The prompt shown during study.")).toBeVisible();
    expect(view.getByRole("heading", { level: 2, name: "Back" })).toBeVisible();
    expect(view.getByText("The answer revealed after the prompt.")).toBeVisible();
    expect(view.getByRole("heading", { level: 2, name: "Tags" })).toBeVisible();
    expect(view.getByText("Organize this card for filtering and study sessions.")).toBeVisible();
    expect(view.getByText("Card information").closest("details")).not.toHaveAttribute("open");
    expect(frontText).toHaveValue("What is the capital of Japan?");
    expect(backText).toHaveValue("Tokyo");
    expect(geography).toBeChecked();
    expect(travel).not.toBeChecked();
    expect(view.getByText("japan-capital")).toBeInTheDocument();
    expect(view.getByText("card-123")).toBeInTheDocument();
    expect(view.getByText(new Date(createdAt).toLocaleDateString())).toBeInTheDocument();
    expect(view.getByText(new Date(lastSeenAt).toLocaleDateString())).toBeInTheDocument();

    fireEvent.change(frontText, { target: { value: "Updated front" } });
    fireEvent.change(backText, { target: { value: "Updated back" } });
    await userEvent.click(travel);

    expect(props.fields.frontText.onChange).toHaveBeenCalledOnce();
    expect(props.fields.backText.onChange).toHaveBeenCalledOnce();
    expect(props.fields.tags[1]?.input.onChange).toHaveBeenCalledOnce();
  });

  it("uses unique section heading relationships for each form instance", () => {
    const view = render(
      <>
        <CardForm {...createProps()} />
        <CardForm {...createProps()} />
      </>
    );
    const sections = view.container.querySelectorAll("section[aria-labelledby]");
    const labelledByIds = Array.from(sections, (section) => section.getAttribute("aria-labelledby"));

    expect(sections).toHaveLength(6);
    expect(new Set(labelledByIds).size).toBe(6);
    for (const section of sections) {
      const headingId = section.getAttribute("aria-labelledby");
      expect(headingId).not.toBeNull();
      expect(section.querySelector(`h2[id='${headingId}']`)).toBeInTheDocument();
    }
  });

  it("associates validation errors with their named controls", () => {
    const view = render(
      <CardForm
        {...createProps({
          errors: { frontText: "Front text is required.", backText: "Back text is required." },
        })}
      />
    );

    expect(view.getByRole("textbox", { name: "Front text" })).toHaveAccessibleDescription("Front text is required.");
    expect(view.getByRole("textbox", { name: "Back text" })).toHaveAccessibleDescription("Back text is required.");
  });

  it("keeps cancel separate from submission while idle", async () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn((event?: React.FormEvent) => event?.preventDefault());
    const view = render(<CardForm {...createProps({ isSubmitting: false, onCancel, onSubmit })} />);
    const cancel = view.getByRole("button", { name: "Cancel" });
    const save = view.getByRole("button", { name: "Save changes" });

    expect(save).toBeEnabled();
    await userEvent.click(cancel);

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.click(save);

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("disables Save changes and shows pending copy only while submitting", () => {
    const view = render(<CardForm {...createProps({ isSubmitting: true })} />);

    expect(view.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(view.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  });
});
