import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { getI18n } from "react-i18next";
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

describe("SETTINGS-04 Toast", () => {
  beforeEach(() => dismissToast());

  afterEach(() => {
    vi.useRealTimers();
    dismissToast();
  });

  it("primes an empty polite live region before a notification is active", () => {
    render(<ToastViewport />);

    expect(screen.getByRole("status", { name: "Toast notifications" })).toBeEmptyDOMElement();
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
    const primedStatus = screen.getByRole("status", { name: "Toast notifications" });

    displayToast({ message: "Save failed", tone: "error" });

    const assertiveAnnouncer = screen.getByRole("alert");
    expect(primedStatus).toBeEmptyDOMElement();
    expect(assertiveAnnouncer).toHaveTextContent("Error: Save failed");
    expect(screen.getAllByText("Save failed")).toHaveLength(1);

    displayToast({ message: "Saved", tone: "success", durationMs: null });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(assertiveAnnouncer).toBeEmptyDOMElement();
    expect(screen.getByRole("status")).toBe(primedStatus);
    expect(primedStatus).toHaveTextContent("Success: Saved");
  });

  it("replaces the announced content when the same message is shown again", () => {
    render(<ToastViewport />);
    const status = screen.getByRole("status", { name: "Toast notifications" });
    displayToast({ message: "Saved", tone: "success", durationMs: null });
    const firstAnnouncement = within(status).getByText("Success: Saved");

    displayToast({ message: "Saved", tone: "success", durationMs: null });

    expect(screen.getByRole("status", { name: "Toast notifications" })).toBe(status);
    expect(within(status).getByText("Success: Saved")).not.toBe(firstAnnouncement);
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

  it("updates its accessible presentation in place while leaving the message untouched", async () => {
    render(<ToastViewport />);
    displayToast({ message: "Saved", tone: "success", durationMs: null });
    const status = screen.getByRole("status", { name: "Toast notifications" });
    const dismissButton = screen.getByRole("button", { name: "Dismiss notification" });

    await getI18n().changeLanguage("ja");

    expect(screen.getByRole("status", { name: "トースト通知" })).toBe(status);
    expect(status).toHaveTextContent("成功: Saved");
    expect(screen.getByRole("button", { name: "通知を閉じる" })).toBe(dismissButton);
    expect(screen.getAllByText("Saved")).toHaveLength(1);
  });

  it("dismisses the active notification from its close button", () => {
    render(
      <>
        <button type="button">Show notification</button>
        <ToastViewport />
      </>
    );
    const trigger = screen.getByRole("button", { name: "Show notification" });
    trigger.focus();
    displayToast({ message: "Saved", tone: "success" });
    const dismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    dismissButton.focus();

    fireEvent.click(dismissButton);

    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("uses a connected application fallback when navigation removes the original focus target", () => {
    const Harness = () => {
      const [sourceRoute, setSourceRoute] = React.useState(true);
      const focusFallbackRef = React.useRef<HTMLElement>(null);
      return (
        <>
          <main ref={focusFallbackRef} tabIndex={-1}>
            {sourceRoute ? (
              <button type="button" onClick={() => setSourceRoute(false)}>
                Leave source route
              </button>
            ) : (
              <h1>Destination route</h1>
            )}
          </main>
          <ToastViewport focusFallbackRef={focusFallbackRef} />
        </>
      );
    };
    render(<Harness />);
    const sourceAction = screen.getByRole("button", { name: "Leave source route" });
    sourceAction.focus();
    displayToast({ message: "Saved", tone: "success", durationMs: null });

    fireEvent.click(sourceAction);
    expect(sourceAction).not.toBeInTheDocument();
    const dismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    dismissButton.focus();
    fireEvent.click(dismissButton);

    expect(screen.getByRole("main")).toHaveFocus();
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

  it("restores focus before replacing a global notification", () => {
    render(
      <>
        <button type="button">Show notification</button>
        <ToastViewport />
      </>
    );
    const trigger = screen.getByRole("button", { name: "Show notification" });
    trigger.focus();
    displayToast({ message: "First", durationMs: null });
    screen.getByRole("button", { name: "Dismiss notification" }).focus();

    displayToast({ message: "Second", durationMs: null });

    expect(trigger).toHaveFocus();
    const secondDismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    secondDismissButton.focus();
    fireEvent.click(secondDismissButton);
    expect(trigger).toHaveFocus();
  });

  it("restores focus when a focused global notification times out", () => {
    vi.useFakeTimers();
    render(
      <>
        <button type="button">Show notification</button>
        <ToastViewport />
      </>
    );
    const trigger = screen.getByRole("button", { name: "Show notification" });
    trigger.focus();
    displayToast({ message: "Saved", durationMs: 1000 });
    screen.getByRole("button", { name: "Dismiss notification" }).focus();

    act(() => vi.advanceTimersByTime(1000));

    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("does not take focus back when focus has moved outside the global notification", () => {
    render(
      <>
        <button type="button">Show notification</button>
        <button type="button">Continue editing</button>
        <ToastViewport />
      </>
    );
    const trigger = screen.getByRole("button", { name: "Show notification" });
    const nextControl = screen.getByRole("button", { name: "Continue editing" });
    trigger.focus();
    const id = displayToast({ message: "Saved", durationMs: null });
    nextControl.focus();

    act(() => dismissToast(id));

    expect(nextControl).toHaveFocus();
  });

  it("shows only the latest notification and ignores an older id", () => {
    render(<ToastViewport />);
    const firstId = displayToast({ message: "First" });
    const secondId = displayToast({ message: "Second" });
    const secondDismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    secondDismissButton.focus();

    expect(secondId).not.toBe(firstId);
    expect(screen.queryByText("First")).not.toBeInTheDocument();
    act(() => dismissToast(firstId));
    expect(screen.getByText("Second")).toBeVisible();
    expect(secondDismissButton).toHaveFocus();
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
