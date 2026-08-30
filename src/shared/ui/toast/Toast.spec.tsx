import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastViewport } from "./Toast";
import { dismissToast, showToast, type ShowToastInput } from "./model";

const displayToast = (input: ShowToastInput) => {
  let id = 0;
  act(() => {
    id = showToast(input);
  });
  return id;
};

describe("Toast", () => {
  beforeEach(() => dismissToast());

  afterEach(() => {
    vi.useRealTimers();
    dismissToast();
  });

  it("primes an empty polite live region before a notification is active", () => {
    render(<ToastViewport />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("publishes non-error content into the already-mounted polite live region", () => {
    render(<ToastViewport />);
    const primedStatus = screen.getByRole("status");

    displayToast({ message: "Saved", tone: "success", durationMs: null });

    expect(screen.getByRole("status")).toBe(primedStatus);
    expect(primedStatus).toHaveTextContent("Success: Saved");
  });

  it("announces errors only through a sibling assertive region", () => {
    render(<ToastViewport />);
    const primedStatus = screen.getByRole("status");

    displayToast({ message: "Save failed", tone: "error" });

    expect(primedStatus).toBeEmptyDOMElement();
    expect(screen.getByRole("alert")).toHaveTextContent("Error: Save failed");
    expect(screen.getAllByText("Save failed")).toHaveLength(1);

    displayToast({ message: "Saved", tone: "success", durationMs: null });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBe(primedStatus);
    expect(primedStatus).toHaveTextContent("Success: Saved");
  });

  it("replaces the announced content when the same message is shown again", () => {
    render(<ToastViewport />);
    const status = screen.getByRole("status");
    displayToast({ message: "Saved", tone: "success", durationMs: null });
    const firstContent = screen.getByText("Saved");

    displayToast({ message: "Saved", tone: "success", durationMs: null });

    expect(screen.getByRole("status")).toBe(status);
    expect(screen.getByText("Saved")).not.toBe(firstContent);
  });

  it.each([
    ["neutral", "Information", "status", "polite"],
    ["success", "Success", "status", "polite"],
    ["warning", "Warning", "status", "polite"],
    ["error", "Error", "alert", "assertive"],
  ] as const)("announces %s notifications with a non-color cue", (tone, label, role, live) => {
    render(<ToastViewport />);
    displayToast({ message: "Saved", tone, durationMs: null });

    const toast = screen.getByRole(role);
    expect(toast).toHaveTextContent(`${label}: Saved`);
    expect(toast).toHaveAttribute("aria-live", live);
    expect(toast).toHaveAttribute("aria-atomic", "true");
  });

  it("dismisses the active notification from its close button", () => {
    render(<ToastViewport />);
    displayToast({ message: "Saved", tone: "success" });

    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));

    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("dismisses before running its action", () => {
    const onClick = vi.fn(() => showToast({ message: "Replacement", tone: "success" }));
    render(<ToastViewport />);
    displayToast({ message: "Try again", tone: "error", action: { label: "Retry", onClick } });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText("Try again")).not.toBeInTheDocument();
    expect(screen.getByText("Replacement")).toBeVisible();
  });

  it("supports non-interactive notifications", () => {
    render(<ToastViewport />);
    displayToast({ message: "Swiped right", dismissible: false, durationMs: 900 });

    expect(screen.getByRole("status")).toHaveTextContent("Swiped right");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each(["neutral", "success"] as const)("automatically dismisses %s notifications after four seconds", (tone) => {
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ message: "Saved", tone });

    act(() => vi.advanceTimersByTime(3999));
    expect(screen.getByText("Saved")).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it.each(["warning", "error"] as const)("keeps %s notifications until the user dismisses or replaces them", (tone) => {
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ message: "Save failed", tone });

    act(() => vi.advanceTimersByTime(60_000));

    expect(screen.getByText("Save failed")).toBeVisible();
  });

  it("uses an explicit duration override", () => {
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ message: "Swiped up", durationMs: 900, dismissible: false });

    act(() => vi.advanceTimersByTime(899));
    expect(screen.getByText("Swiped up")).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Swiped up")).not.toBeInTheDocument();
  });

  it("shows only the latest notification and ignores an older id", () => {
    render(<ToastViewport />);
    const firstId = displayToast({ message: "First" });
    const secondId = displayToast({ message: "Second" });

    expect(secondId).not.toBe(firstId);
    expect(screen.queryByText("First")).not.toBeInTheDocument();
    act(() => dismissToast(firstId));
    expect(screen.getByText("Second")).toBeVisible();
  });

  it("does not let an older timer dismiss a replacement", () => {
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ message: "Repeated", durationMs: 1000 });
    act(() => vi.advanceTimersByTime(500));
    displayToast({ message: "Repeated", durationMs: 1000 });

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText("Repeated")).toBeVisible();
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByText("Repeated")).not.toBeInTheDocument();
  });
});
