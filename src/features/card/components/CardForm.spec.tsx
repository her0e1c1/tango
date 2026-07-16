import { cleanup, fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { CardForm, type CardFormProps } from "@/features/card/components/CardForm";
import { createCard } from "@/test/factories";

const createdAt = Date.UTC(2026, 0, 2);
const lastSeenAt = Date.UTC(2026, 1, 3);

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

  it("groups card content, tags, and metadata while preserving values and callbacks", async () => {
    const props = createProps();
    const view = render(<CardForm {...props} />);
    const frontText = view.container.querySelector("textarea[name='frontText']") as HTMLTextAreaElement;
    const backText = view.container.querySelector("textarea[name='backText']") as HTMLTextAreaElement;
    const geography = view.container.querySelector("input[name='tags'][value='geography']") as HTMLInputElement;
    const travel = view.container.querySelector("input[name='tags'][value='travel']") as HTMLInputElement;

    expect(view.getByRole("heading", { level: 2, name: "Card content" })).toBeVisible();
    expect(view.getByRole("heading", { level: 2, name: "Tags" })).toBeVisible();
    expect(view.getByRole("heading", { level: 2, name: "Metadata" })).toBeVisible();
    expect(frontText).toHaveValue("What is the capital of Japan?");
    expect(backText).toHaveValue("Tokyo");
    expect(geography).toBeChecked();
    expect(travel).not.toBeChecked();
    expect(view.getByText("japan-capital")).toBeVisible();
    expect(view.getByText("card-123")).toBeVisible();
    expect(view.getByText(String(createdAt))).toBeVisible();
    expect(view.getByText(new Date(lastSeenAt).toLocaleDateString())).toBeVisible();

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

  it("submits when idle and has no cancel action", async () => {
    const onSubmit = vi.fn((event?: React.FormEvent) => event?.preventDefault());
    const view = render(<CardForm {...createProps({ isSubmitting: false, onSubmit })} />);
    const save = view.getByRole("button", { name: "Save" });

    expect(save).toBeEnabled();
    expect(view.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    await userEvent.click(save);

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("disables Save only while submitting", () => {
    const view = render(<CardForm {...createProps({ isSubmitting: true })} />);

    expect(view.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
