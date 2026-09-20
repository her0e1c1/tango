/**
 * @file Verifies the "SwipeButtonList" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as triggering swipe callbacks
 * via click and keyboard navigation.
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SwipeButtonList } from "./SwipeButtonList";

describe("SwipeButtonList [SWIPE-05]", () => {
  it("keeps disabled directions visible and skips them during keyboard navigation", async () => {
    const user = userEvent.setup();
    const onClickLeft = vi.fn();
    render(<SwipeButtonList disabledDirections={{ cardSwipeLeft: true }} onClickLeft={onClickLeft} />);
    const left = screen.getByRole("button", { name: "Swipe left" });
    expect(left).toBeVisible();
    expect(left).toBeDisabled();
    await user.click(left);
    expect(onClickLeft).not.toHaveBeenCalled();
    await user.tab();
    expect(screen.getByRole("button", { name: "Swipe up" })).toHaveFocus();
  });

  it("activates swipe actions with Enter", async () => {
    const onClickLeft = vi.fn();
    const user = userEvent.setup();
    render(<SwipeButtonList onClickLeft={onClickLeft} />);

    screen.getByRole("button", { name: "Swipe left" }).focus();
    await user.keyboard("{Enter}");

    expect(onClickLeft).toHaveBeenCalledOnce();
  });
});
