import { cleanup, fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckForm, type DeckFormProps } from "@/features/deck/components/DeckForm";
import { createDeck } from "@/test/factories";

const createProps = (overrides: Partial<DeckFormProps> = {}): DeckFormProps => ({
  deck: createDeck({
    id: "deck-123",
    name: "Japanese vocabulary",
    url: "https://example.com/deck.csv",
    category: "language",
    convertToBr: true,
    isPublic: true,
    localMode: false,
    createdAt: Date.UTC(2026, 0, 2),
    updatedAt: Date.UTC(2026, 1, 3),
  }),
  fields: {
    name: { name: "name", value: "Japanese vocabulary", onChange: vi.fn() },
    convertToBr: { name: "convertToBr", checked: true, onChange: vi.fn() },
    url: { name: "url", value: "https://example.com/deck.csv", onChange: vi.fn() },
    isPublic: { name: "isPublic", checked: true, onChange: vi.fn() },
    localMode: { name: "localMode", checked: false, onChange: vi.fn() },
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
  afterEach(cleanup);

  it("groups deck details, availability, and metadata while preserving field values and callbacks", async () => {
    const props = createProps();
    const view = render(<DeckForm {...props} />);
    const name = view.container.querySelector("input[name='name']") as HTMLInputElement;
    const convertToBr = view.container.querySelector("input[name='convertToBr']") as HTMLInputElement;
    const url = view.container.querySelector("input[name='url']") as HTMLInputElement;
    const category = view.container.querySelector("select[name='category']") as HTMLSelectElement;

    expect(view.getByRole("heading", { level: 2, name: "Deck details" })).toBeVisible();
    expect(view.getByRole("heading", { level: 2, name: "Availability" })).toBeVisible();
    expect(view.getByRole("heading", { level: 2, name: "Metadata" })).toBeVisible();
    expect(name).toHaveValue("Japanese vocabulary");
    expect(convertToBr).toBeChecked();
    expect(url).toHaveValue("https://example.com/deck.csv");
    expect(category).toHaveValue("language");
    expect(view.getByText("deck-123")).toBeVisible();
    expect(view.getByText(new Date(Date.UTC(2026, 0, 2)).toLocaleDateString())).toBeVisible();
    expect(view.getByText(new Date(Date.UTC(2026, 1, 3)).toLocaleDateString())).toBeVisible();

    fireEvent.change(name, { target: { value: "Updated deck" } });
    await userEvent.click(convertToBr);
    fireEvent.change(url, { target: { value: "https://example.com/updated.csv" } });
    await userEvent.selectOptions(category, "science");

    expect(props.fields.name.onChange).toHaveBeenCalledOnce();
    expect(props.fields.convertToBr.onChange).toHaveBeenCalledOnce();
    expect(props.fields.url.onChange).toHaveBeenCalledOnce();
    expect(props.fields.category.onChange).toHaveBeenCalledOnce();
  });

  it("keeps Public and Local Mode disabled with explicit unavailable help", () => {
    const view = render(<DeckForm {...createProps()} />);

    expect(view.container.querySelector("input[name='isPublic']")).toBeDisabled();
    expect(view.container.querySelector("input[name='isPublic']")).toBeChecked();
    expect(view.container.querySelector("input[name='localMode']")).toBeDisabled();
    expect(view.container.querySelector("input[name='localMode']")).not.toBeChecked();
    expect(view.getAllByText(/not available yet/i)).toHaveLength(2);
  });

  it("submits when idle and has no cancel action", async () => {
    const onSubmit = vi.fn((event?: React.FormEvent) => event?.preventDefault());
    const view = render(<DeckForm {...createProps({ isSubmitting: false, onSubmit })} />);
    const save = view.getByRole("button", { name: "Save" });

    expect(save).toBeEnabled();
    expect(view.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    await userEvent.click(save);

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("disables Save only while submitting", () => {
    const view = render(<DeckForm {...createProps({ isSubmitting: true })} />);

    expect(view.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
