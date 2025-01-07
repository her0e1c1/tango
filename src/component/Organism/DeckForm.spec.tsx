import React from "react";

import userEvent from "@testing-library/user-event";
import { render, cleanup } from "@testing-library/react";
import { expect, it, describe, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckForm as DeckEdit } from "./DeckForm";

describe("DeckEdit", () => {
  afterEach(() => {
    cleanup();
  });
  const deck = {
    name: "NAME",
    isPublic: false,
    convertToBr: false,
    url: "",
    category: "",
    createdAt: "",
    updatedAt: "",
  } as unknown as Deck;

  // it('should validate', async () => {
  //     await expect(schema.validate(deck)).resolves.toEqual(deck)
  // })

  it("should submit", async () => {
    const onSubmit = vi.fn();
    const c = render(<DeckEdit deck={deck} onSubmit={onSubmit} />);
    await userEvent.click(c.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith(deck);
  });

  it("should update name", async () => {
    const onSubmit = vi.fn();
    const c = render(<DeckEdit deck={deck} onSubmit={onSubmit} />);
    const input = c.container.querySelector("input[name='name']") as Element;
    await userEvent.clear(input);
    await userEvent.type(input, "UPDATED");
    await userEvent.click(c.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({ ...deck, name: "UPDATED" });
  });

  it("should update url", async () => {
    const onSubmit = vi.fn();
    const c = render(<DeckEdit deck={deck} onSubmit={onSubmit} />);
    const input = c.container.querySelector("input[name='url']") as Element;
    await userEvent.clear(input);
    await userEvent.type(input, "UPDATED");
    await userEvent.click(c.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({ ...deck, url: "UPDATED" });
  });

  it("should update isPublic", async () => {
    const onSubmit = vi.fn();
    const c = render(<DeckEdit deck={deck} onSubmit={onSubmit} />);
    const input = c.container.querySelector("input[name='isPublic']") as Element;
    await userEvent.click(input);
    await userEvent.click(c.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({ ...deck, isPublic: true });
  });

  it("should update convertToBr", async () => {
    const onSubmit = vi.fn();
    const c = render(<DeckEdit deck={deck} onSubmit={onSubmit} />);
    const input = c.container.querySelector("input[name='convertToBr']") as Element;
    await userEvent.click(input);
    await userEvent.click(c.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({ ...deck, convertToBr: true });
  });

  it("should update category", async () => {
    const onSubmit = vi.fn();
    const c = render(
      <DeckEdit deck={deck} onSubmit={onSubmit} categoryOptions={[{ label: "LABEL", value: "VALUE" }]} />
    );
    const select = c.container.querySelector("select[name='category']") as Element;
    await userEvent.selectOptions(select, "LABEL");
    await userEvent.click(c.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({ ...deck, category: "VALUE" });
  });
});
