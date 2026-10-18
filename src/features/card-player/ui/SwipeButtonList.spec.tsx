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

describe("SwipeButtonList [STUDY-ACTIONS-04]", () => {
  it("keeps disabled directions visible and skips them during keyboard navigation", async () => {
    // Given: Prepare `user`, `onClickLeft`, `left` and any shared test state below.
    const user = userEvent.setup();
    const onClickLeft = vi.fn();
    render(<SwipeButtonList disabledDirections={{ cardSwipeLeft: true }} onClickLeft={onClickLeft} />);
    const left = screen.getByRole("button", { name: "Swipe left" });
    expect(left).toBeVisible();
    expect(left).toBeDisabled();
    // When: Exercise `user.click` with the prepared inputs.
    await user.click(left);
    // Then: Verify the expected result in the assertions below.
    expect(onClickLeft).not.toHaveBeenCalled();
    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Swipe up" })).toHaveFocus();
  });

  it("activates swipe actions with Enter", async () => {
    // Given: Prepare `onClickLeft`, `user` and any shared test state below.
    const onClickLeft = vi.fn();
    const user = userEvent.setup();
    render(<SwipeButtonList onClickLeft={onClickLeft} />);

    screen.getByRole("button", { name: "Swipe left" }).focus();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Enter}");

    // Then: Verify the expected result in the assertions below.
    expect(onClickLeft).toHaveBeenCalledOnce();
  });
});
