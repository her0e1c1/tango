import React from "react";

import userEvent from "@testing-library/user-event";
import { render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { expect, it, describe, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

import { ConfigForm } from "./ConfigForm";

describe("ConfigFrom", () => {
  afterEach(() => {
    cleanup();
  });
  const config = {
    showHeader: false,
    showSwipeButtonList: false,
    showSwipeFeedback: false,
    fullscreen: false,
    darkMode: false,
    shuffled: false,
    useCardInterval: false,
    defaultAutoPlay: false,
    maxNumberOfCardsToLearn: 0,
    cardInterval: 0,
    githubAccessToken: "",
    localMode: true,
  } as ConfigState;
  it("should update showHeader", async () => {
    const onSubmit = vi.fn();
    const c = render(<ConfigForm config={config} onSubmit={onSubmit} />);
    await userEvent.click(c.container.querySelector("input[name='showHeader']") as Element);
    expect(onSubmit).toHaveBeenCalledWith({ ...config, showHeader: true });
  });
  it("should update showSwipeButtonList", async () => {
    const onSubmit = vi.fn();
    const c = render(<ConfigForm config={config} onSubmit={onSubmit} />);
    await userEvent.click(c.container.querySelector("input[name='showSwipeButtonList']") as Element);
    expect(onSubmit).toHaveBeenCalledWith({ ...config, showSwipeButtonList: true });
  });
  it("should update showSwipeFeedback", async () => {
    const onSubmit = vi.fn();
    const c = render(<ConfigForm config={config} onSubmit={onSubmit} />);
    await userEvent.click(c.container.querySelector("input[name='showSwipeFeedback']") as Element);
    expect(onSubmit).toHaveBeenCalledWith({ ...config, showSwipeFeedback: true });
  });
  it("should update maxNumberOfCardsToLearn", async () => {
    const onSubmit = vi.fn();
    const c = render(<ConfigForm config={config} onSubmit={onSubmit} />);
    fireEvent.change(c.container.querySelector("input[name='maxNumberOfCardsToLearn']") as Element, {
      target: { value: 10 },
    });
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ ...config, maxNumberOfCardsToLearn: 10 });
    });
  });
  it.skip("should update cardInterval", async () => {
    const onSubmit = vi.fn();
    const c = render(<ConfigForm config={config} onSubmit={onSubmit} />);
    fireEvent.change(c.container.querySelector("input[name='cardInterval']") as Element, { target: { value: 10 } });
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ ...config, cardInterval: 10 });
    });
  });
});
