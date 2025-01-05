import React from "react";

import userEvent from "@testing-library/user-event";
import { render, cleanup } from "@testing-library/react";
import { expect, it, describe, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

import { CardForm as CardEdit } from "./CardForm";

describe("CardEdit", () => {
  afterEach(() => {
    cleanup();
  });
  const card = {
    frontText: "FRONT TEXT",
    backText: "BACK TEXT",
    tags: [] as string[],
    lastSeenAt: 1,
  } as Card;

  // it('should validate', async () => {
  //     await expect(schema.validate(card)).resolves.toEqual(card)
  //     await expect(schema.validate({...card, tags: ["mytag"]})).resolves.toEqual({...card, tags: ["mytag"]})
  //     await expect(schema.validate({...card, tags: undefined})).rejects.toThrow(/required/)
  // })

  it("should submit", async () => {
    const onSubmit = vi.fn();
    const c = render(<CardEdit card={card} onSubmit={onSubmit} />);
    await userEvent.click(c.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith(card);
  });

  it("should update frontText", async () => {
    const onSubmit = vi.fn();
    const c = render(<CardEdit card={card} onSubmit={onSubmit} />);
    const input = c.container.querySelector("textarea[name='frontText']") as Element;
    await userEvent.clear(input);
    await userEvent.type(input, "UPDATED");
    await userEvent.click(c.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({ ...card, frontText: "UPDATED" });
  });

  it("should update backText", async () => {
    const onSubmit = vi.fn();
    const c = render(<CardEdit card={card} onSubmit={onSubmit} />);
    const input = c.container.querySelector("textarea[name='backText']") as Element;
    await userEvent.clear(input);
    await userEvent.type(input, "UPDATED");
    await userEvent.click(c.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({ ...card, backText: "UPDATED" });
  });

  it("should update tags", async () => {
    const onSubmit = vi.fn();
    const c = render(
      <CardEdit
        card={card}
        onSubmit={onSubmit}
        categoryOptions={["tag 1", "tag 2", "tag 3"].map((v) => ({ label: v, value: v }))}
      />
    );
    await userEvent.click(c.container.querySelector("input[name='tags']:first-child") as Element);
    await userEvent.click(c.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({ ...card, tags: ["tag 1"] });
  });
});
