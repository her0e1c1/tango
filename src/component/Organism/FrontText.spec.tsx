import React from "react";

import { render, cleanup } from "@testing-library/react";
import { expect, it, describe, vi, afterEach } from "vitest";
import "@testing-library/jest-dom";

import { FrontText } from "./FrontText";

describe("FrontText", () => {
  afterEach(() => {
    cleanup();
  });
  it("should swipe", async () => {
    const onSwipe = vi.fn();
    const c = render(<FrontText text="text" onSwipeLeft={onSwipe} />);
    const t = c.container.querySelector("#frontText");
    expect(t).toBeVisible();
    // TODO: await waitFor(() => expect(onSwipe).toHaveBeenCalledTimes(1))
  });
});
