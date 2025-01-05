import React from "react";

import userEvent from "@testing-library/user-event";
import { render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { expect, it, describe, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckStartForm } from "./DeckStartForm";

describe.skip("DeckStartForm", () => {
  afterEach(() => {
    cleanup();
  });
  const deck = {
    scoreMax: 1,
    scoreMin: -1,
    tagAndFilter: false,
    selectedTags: [],
  } as unknown as Deck;
  const tags = ["tag1", "tag2", "tag3"] as string[];

  it("should submit", async () => {
    const onSubmit = vi.fn();
    const c = render(<DeckStartForm onSubmit={onSubmit} deck={deck} tags={tags} />);
    fireEvent.change(c.container.querySelector("input[name='scoreMax']") as Element, { target: { value: 2 } });
    fireEvent.change(c.container.querySelector("input[name='scoreMin']") as Element, { target: { value: -2 } });
    await userEvent.click(c.container.querySelector("input[name='tag-filter-click-filter']") as Element);
    await userEvent.click(c.getByRole("button", { name: /all/i }));
    await waitFor(() => {
      expect(onSubmit).lastCalledWith({ ...deck, scoreMax: 2, scoreMin: -2, tagAndFilter: true, selectedTags: tags });
    });
  });
  it("should update score", async () => {
    const onSubmit = vi.fn();
    const c = render(
      <DeckStartForm onSubmit={onSubmit} deck={{ ...deck, scoreMax: null, scoreMin: null }} tags={tags} />
    );
    // set on
    await userEvent.click(c.container.querySelector("input[name='scoreMaxSwitch']") as Element);
    expect(onSubmit).lastCalledWith({ ...deck, scoreMax: 0, scoreMin: null });
    await userEvent.click(c.container.querySelector("input[name='scoreMinSwitch']") as Element);
    expect(onSubmit).lastCalledWith({ ...deck, scoreMax: 0, scoreMin: 0 });

    // update sliders
    fireEvent.change(c.container.querySelector("input[name='scoreMax']") as Element, { target: { value: 2 } });
    fireEvent.change(c.container.querySelector("input[name='scoreMin']") as Element, { target: { value: -2 } });
    await waitFor(() => {
      expect(onSubmit).lastCalledWith({ ...deck, scoreMax: 2, scoreMin: -2 });
    });

    // off again
    await userEvent.click(c.container.querySelector("input[name='scoreMaxSwitch']") as Element);
    await userEvent.click(c.container.querySelector("input[name='scoreMinSwitch']") as Element);
    expect(onSubmit).lastCalledWith({ ...deck, scoreMax: null, scoreMin: null });
  });
});
