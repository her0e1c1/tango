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
  afterEach(cleanup);

  it("groups editable settings and deck information while preserving field values and callbacks", async () => {
    const props = createProps();
    const view = render(<DeckForm {...props} />);
    const name = view.container.querySelector("input[name='name']") as HTMLInputElement;
    const convertToBr = view.container.querySelector("input[name='convertToBr']") as HTMLInputElement;
    const url = view.container.querySelector("input[name='url']") as HTMLInputElement;
    const category = view.container.querySelector("select[name='category']") as HTMLSelectElement;

    expect(view.getByRole("heading", { level: 2, name: "Basic information" })).toBeVisible();
    expect(view.getByRole("heading", { level: 2, name: "Import & formatting" })).toBeVisible();
    const deckInformation = view.getByText("Deck information");
    expect(deckInformation).toBeVisible();
    expect(view.queryByText("Public")).not.toBeInTheDocument();
    expect(view.container.querySelector("input[name='isPublic']")).not.toBeInTheDocument();
    expect(name).toHaveValue("Japanese vocabulary");
    expect(view.getByRole("checkbox", { name: "Convert line breaks" })).toBe(convertToBr);
    expect(convertToBr).toBeChecked();
    expect(url).toHaveValue("https://example.com/deck.csv");
    expect(category).toHaveValue("language");
    await userEvent.click(deckInformation);
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

  it("uses unique section heading relationships for each form instance", () => {
    const view = render(
      <>
        <DeckForm {...createProps()} />
        <DeckForm {...createProps()} />
      </>
    );
    const sections = view.container.querySelectorAll("section[aria-labelledby]");
    const labelledByIds = Array.from(sections, (section) => section.getAttribute("aria-labelledby"));

    expect(sections).toHaveLength(4);
    expect(new Set(labelledByIds).size).toBe(4);
    for (const section of sections) {
      const headingId = section.getAttribute("aria-labelledby");
      expect(headingId).not.toBeNull();
      expect(section.querySelector(`h2[id='${headingId}']`)).toBeInTheDocument();
    }
  });

  it("submits or cancels from the action row", async () => {
    const onSubmit = vi.fn((event?: React.FormEvent) => event?.preventDefault());
    const onCancel = vi.fn();
    const view = render(<DeckForm {...createProps({ isSubmitting: false, onSubmit, onCancel })} />);
    const cancel = view.getByRole("button", { name: "Cancel" });
    const save = view.getByRole("button", { name: "Save changes" });

    await userEvent.click(cancel);
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(save).toBeEnabled();
    await userEvent.click(save);

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("shows a disabled saving action while submitting", () => {
    const view = render(<DeckForm {...createProps({ isSubmitting: true })} />);

    expect(view.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });
});
