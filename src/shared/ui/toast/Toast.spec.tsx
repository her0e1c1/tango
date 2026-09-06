import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { getI18n } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";

import { ToastViewport } from "./Toast";
import { dismissToast, showToast, type ShowToastInput } from "./model";

const displayToast = (input: ShowToastInput) => {
  let id = 0;
  act(() => {
    id = showToast(input);
  });
  return id;
};

describe("Toast [ACCOUNT-05] [SWIPE-02] [ACCOUNT-02] [IMPORT-04] [IMPORT-05]", () => {
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

    displayToast({ messageKey: "account.toast.signInSuccess", tone: "success", durationMs: null });

    expect(screen.getByRole("status")).toBe(primedStatus);
    expect(primedStatus).toHaveTextContent("Success: Signed in.");
  });

  it("announces errors only through a sibling assertive region", () => {
    render(<ToastViewport />);
    const primedStatus = screen.getByRole("status", { name: "Toast notifications" });

    displayToast({ messageKey: "toast.saveFailure", tone: "error" });

    const assertiveAnnouncer = screen.getByRole("alert");
    expect(primedStatus).toBeEmptyDOMElement();
    expect(assertiveAnnouncer).toHaveTextContent("Error: Unable to save changes. Try again.");
    expect(screen.getAllByText("Unable to save changes. Try again.")).toHaveLength(1);

    displayToast({ messageKey: "account.toast.signInSuccess", tone: "success", durationMs: null });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(assertiveAnnouncer).toBeEmptyDOMElement();
    expect(screen.getByRole("status")).toBe(primedStatus);
    expect(primedStatus).toHaveTextContent("Success: Signed in.");
  });

  it("replaces the announced content when the same message is shown again", () => {
    render(<ToastViewport />);
    const status = screen.getByRole("status", { name: "Toast notifications" });
    displayToast({ messageKey: "account.toast.signInSuccess", tone: "success", durationMs: null });
    const firstAnnouncement = within(status).getByText("Success: Signed in.");

    displayToast({ messageKey: "account.toast.signInSuccess", tone: "success", durationMs: null });

    expect(screen.getByRole("status", { name: "Toast notifications" })).toBe(status);
    expect(within(status).getByText("Success: Signed in.")).not.toBe(firstAnnouncement);
  });

  it.each([
    ["neutral", "Information", "status", "polite"],
    ["success", "Success", "status", "polite"],
    ["warning", "Warning", "status", "polite"],
    ["error", "Error", "alert", "assertive"],
  ] as const)("announces %s notifications with a non-color cue", (tone, label, role, live) => {
    render(<ToastViewport />);
    displayToast({ messageKey: "account.toast.signInSuccess", tone, durationMs: null });

    const toast = screen.getByRole(role);
    expect(toast).toHaveTextContent(`${label}: Signed in.`);
    expect(toast).toHaveAttribute("aria-live", live);
    expect(toast).toHaveAttribute("aria-atomic", "true");
  });

  it("translates the visible message and accessible presentation in place when the language changes", async () => {
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ messageKey: "deckImport.toast.imported", messageParams: { count: 2 }, tone: "success" });
    const status = screen.getByRole("status", { name: "Toast notifications" });
    const dismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    dismissButton.focus();
    expect(status).toHaveTextContent("Success: Imported 2 cards.");
    act(() => vi.advanceTimersByTime(2000));

    await actAsync(async () => {
      await getI18n().changeLanguage("ja");
    });

    expect(screen.getByRole("status", { name: "トースト通知" })).toBe(status);
    expect(status).toHaveTextContent("成功: 2枚のカードをインポートしました。");
    expect(screen.getByRole("button", { name: "通知を閉じる" })).toBe(dismissButton);
    expect(dismissButton).toHaveFocus();
    expect(screen.getByText("2枚のカードをインポートしました。")).toBeVisible();

    act(() => vi.advanceTimersByTime(1999));
    expect(screen.getByText("2枚のカードをインポートしました。")).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(status).toBeEmptyDOMElement();
    expect(screen.queryByText("2枚のカードをインポートしました。")).not.toBeInTheDocument();
  });

  it.each([
    ["en", 1, "Imported 1 card."],
    ["en", 2, "Imported 2 cards."],
    ["en", 0, "Imported 0 cards."],
    ["ja", 2, "2枚のカードをインポートしました。"],
  ] as const)("displays and announces an import count in %s for %s cards", async (language, count, expected) => {
    await getI18n().changeLanguage(language);
    render(<ToastViewport />);

    displayToast({ messageKey: "deckImport.toast.imported", messageParams: { count }, tone: "success" });

    expect(screen.getByText(expected)).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(expected);
  });

  it("includes error details in both the visible message and its announcement", () => {
    render(<ToastViewport />);

    displayToast({
      messageKey: "deckImport.toast.failureWithReason",
      messageParams: { reason: "Card storage is unavailable." },
      tone: "error",
    });

    expect(screen.getByText("Import failed. Card storage is unavailable.")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Error: Import failed. Card storage is unavailable.");
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
    displayToast({ messageKey: "account.toast.signInSuccess", tone: "success" });
    const dismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    dismissButton.focus();

    fireEvent.click(dismissButton);

    expect(screen.queryByText("Signed in.")).not.toBeInTheDocument();
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
    displayToast({ messageKey: "account.toast.signInSuccess", tone: "success", durationMs: null });

    fireEvent.click(sourceAction);
    expect(sourceAction).not.toBeInTheDocument();
    const dismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    dismissButton.focus();
    fireEvent.click(dismissButton);

    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("supports non-interactive notifications", () => {
    render(<ToastViewport />);
    displayToast({ messageKey: "studySession.feedback.swipedRight", dismissible: false, durationMs: 900 });

    expect(screen.getByRole("status")).toHaveTextContent("Swiped right");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows visual content while announcing its textual meaning", () => {
    render(<ToastViewport />);
    displayToast({
      messageKey: "studySession.feedback.swipedRight",
      visualContent: <span data-testid="direction-icon">→</span>,
      dismissible: false,
      durationMs: null,
    });

    expect(screen.getByTestId("direction-icon")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Information: Swiped right");
    expect(screen.getAllByText("Swiped right")).toHaveLength(1);
  });

  it.each(["neutral", "success"] as const)("automatically dismisses %s notifications after four seconds", (tone) => {
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ messageKey: "account.toast.signInSuccess", tone });

    act(() => vi.advanceTimersByTime(3999));
    expect(screen.getByText("Signed in.")).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Signed in.")).not.toBeInTheDocument();
  });

  it.each(["warning", "error"] as const)("keeps %s notifications until the user dismisses or replaces them", (tone) => {
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ messageKey: "toast.saveFailure", tone });

    act(() => vi.advanceTimersByTime(60_000));

    expect(screen.getByText("Unable to save changes. Try again.")).toBeVisible();
  });

  it("uses an explicit duration override", () => {
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ messageKey: "studySession.feedback.swipedUp", durationMs: 900, dismissible: false });

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
    displayToast({ messageKey: "account.toast.signInSuccess", durationMs: null });
    screen.getByRole("button", { name: "Dismiss notification" }).focus();

    displayToast({ messageKey: "account.toast.signOutSuccess", durationMs: null });

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
    displayToast({ messageKey: "account.toast.signInSuccess", durationMs: 1000 });
    screen.getByRole("button", { name: "Dismiss notification" }).focus();

    act(() => vi.advanceTimersByTime(1000));

    expect(screen.queryByText("Signed in.")).not.toBeInTheDocument();
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
    const id = displayToast({ messageKey: "account.toast.signInSuccess", durationMs: null });
    nextControl.focus();

    act(() => dismissToast(id));

    expect(nextControl).toHaveFocus();
  });

  it("shows only the latest notification and ignores an older id", () => {
    render(<ToastViewport />);
    const firstId = displayToast({ messageKey: "account.toast.signInSuccess" });
    const secondId = displayToast({ messageKey: "account.toast.signOutSuccess" });
    const secondDismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    secondDismissButton.focus();

    expect(secondId).not.toBe(firstId);
    expect(screen.queryByText("Signed in.")).not.toBeInTheDocument();
    act(() => dismissToast(firstId));
    expect(screen.getByText("Signed out.")).toBeVisible();
    expect(secondDismissButton).toHaveFocus();
  });

  it("does not let an older timer dismiss a replacement", () => {
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ messageKey: "account.toast.signInSuccess", durationMs: 1000 });
    act(() => vi.advanceTimersByTime(500));
    displayToast({ messageKey: "account.toast.signInSuccess", durationMs: 1000 });

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText("Signed in.")).toBeVisible();
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByText("Signed in.")).not.toBeInTheDocument();
  });
});
