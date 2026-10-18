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

describe("Toast [ACCOUNT-05] [STUDY-ACTIONS-01] [ACCOUNT-02] [DECK-IMPORT-04] [DECK-IMPORT-05]", () => {
  beforeEach(() => dismissToast());

  afterEach(() => {
    vi.useRealTimers();
    dismissToast();
  });

  it("primes an empty polite live region before a notification is active", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<ToastViewport />);

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status", { name: "Toast notifications" })).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("publishes non-error content into the already-mounted polite live region", () => {
    // Given: Prepare `primedStatus` and any shared test state below.
    render(<ToastViewport />);
    const primedStatus = screen.getByRole("status");

    // When: Exercise `displayToast` with the prepared inputs.
    displayToast({ messageKey: "account.toast.signInSuccess", tone: "success", durationMs: null });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status")).toBe(primedStatus);
    expect(primedStatus).toHaveTextContent("Success: Signed in.");
  });

  it("announces errors only through a sibling assertive region", () => {
    // Given: Prepare `primedStatus` and any shared test state below.
    render(<ToastViewport />);
    const primedStatus = screen.getByRole("status", { name: "Toast notifications" });

    // When: Exercise `displayToast` with the prepared inputs.
    displayToast({ messageKey: "toast.saveFailure", tone: "error" });

    const assertiveAnnouncer = screen.getByRole("alert");
    // Then: Verify the expected result in the assertions below.
    expect(primedStatus).toBeEmptyDOMElement();
    expect(assertiveAnnouncer).toHaveTextContent("Error: Unable to save changes. Try again.");
    expect(screen.getAllByText("Unable to save changes. Try again.")).toHaveLength(1);

    // When: Exercise `displayToast` with the prepared inputs.
    displayToast({ messageKey: "account.toast.signInSuccess", tone: "success", durationMs: null });

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(assertiveAnnouncer).toBeEmptyDOMElement();
    expect(screen.getByRole("status")).toBe(primedStatus);
    expect(primedStatus).toHaveTextContent("Success: Signed in.");
  });

  it("replaces the announced content when the same message is shown again", () => {
    // Given: Prepare `status`, `firstAnnouncement` and any shared test state below.
    render(<ToastViewport />);
    const status = screen.getByRole("status", { name: "Toast notifications" });
    displayToast({ messageKey: "account.toast.signInSuccess", tone: "success", durationMs: null });
    const firstAnnouncement = within(status).getByText("Success: Signed in.");

    // When: Exercise `displayToast` with the prepared inputs.
    displayToast({ messageKey: "account.toast.signInSuccess", tone: "success", durationMs: null });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status", { name: "Toast notifications" })).toBe(status);
    expect(within(status).getByText("Success: Signed in.")).not.toBe(firstAnnouncement);
  });

  it.each([
    ["neutral", "Information", "status", "polite"],
    ["success", "Success", "status", "polite"],
    ["warning", "Warning", "status", "polite"],
    ["error", "Error", "alert", "assertive"],
  ] as const)("announces %s notifications with a non-color cue", (tone, label, role, live) => {
    // Given: Use this case's inputs and any shared test setup.
    render(<ToastViewport />);
    // When: Exercise `displayToast` with the prepared inputs.
    displayToast({ messageKey: "account.toast.signInSuccess", tone, durationMs: null });

    const toast = screen.getByRole(role);
    // Then: Verify the expected result in the assertions below.
    expect(toast).toHaveTextContent(`${label}: Signed in.`);
    expect(toast).toHaveAttribute("aria-live", live);
    expect(toast).toHaveAttribute("aria-atomic", "true");
  });

  it("translates the visible message and accessible presentation in place when the language changes", async () => {
    // Given: Prepare `status`, `dismissButton` and any shared test state below.
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ messageKey: "deckImport.toast.imported", messageParams: { count: 2 }, tone: "success" });
    const status = screen.getByRole("status", { name: "Toast notifications" });
    const dismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    // When: Exercise `dismissButton.focus` with the prepared inputs.
    dismissButton.focus();
    // Then: Verify the expected result in the assertions below.
    expect(status).toHaveTextContent("Success: Imported 2 cards.");
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(2000));

    await actAsync(async () => {
      await getI18n().changeLanguage("ja");
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status", { name: "トースト通知" })).toBe(status);
    expect(status).toHaveTextContent("成功: 2枚のカードをインポートしました。");
    expect(screen.getByRole("button", { name: "通知を閉じる" })).toBe(dismissButton);
    expect(dismissButton).toHaveFocus();
    expect(screen.getByText("2枚のカードをインポートしました。")).toBeVisible();

    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(1999));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("2枚のカードをインポートしました。")).toBeVisible();
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(1));
    // Then: Verify the expected result in the assertions below.
    expect(status).toBeEmptyDOMElement();
    expect(screen.queryByText("2枚のカードをインポートしました。")).not.toBeInTheDocument();
  });

  it.each([
    ["en", 1, "Imported 1 card."],
    ["en", 2, "Imported 2 cards."],
    ["en", 0, "Imported 0 cards."],
    ["ja", 2, "2枚のカードをインポートしました。"],
  ] as const)("displays and announces an import count in %s for %s cards", async (language, count, expected) => {
    // Given: Use this case's inputs and any shared test setup.
    await getI18n().changeLanguage(language);
    render(<ToastViewport />);

    // When: Exercise `displayToast` with the prepared inputs.
    displayToast({ messageKey: "deckImport.toast.imported", messageParams: { count }, tone: "success" });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText(expected)).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(expected);
  });

  it("includes localized failure guidance in both the visible message and its announcement", () => {
    // Given: Use this case's inputs and any shared test setup.
    render(<ToastViewport />);

    // When: Exercise `displayToast` with the prepared inputs.
    displayToast({
      messageKey: "deckImport.errors.permission",
      tone: "error",
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("You do not have permission to import this data.")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Error: You do not have permission to import this data.");
  });

  it("dismisses the active notification from its close button", () => {
    // Given: Prepare `trigger`, `dismissButton` and any shared test state below.
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

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(dismissButton);

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByText("Signed in.")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("uses a connected application fallback when navigation removes the original focus target", () => {
    // Given: Prepare `Harness`, `sourceAction` and any shared test state below.
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

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(sourceAction);
    // Then: Verify the expected result in the assertions below.
    expect(sourceAction).not.toBeInTheDocument();
    const dismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    // When: Exercise `dismissButton.focus` with the prepared inputs.
    dismissButton.focus();
    fireEvent.click(dismissButton);

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("supports non-interactive notifications", () => {
    // Given: Use this case's inputs and any shared test setup.
    render(<ToastViewport />);
    // When: Exercise `displayToast` with the prepared inputs.
    displayToast({ messageKey: "studySession.feedback.swipedRight", dismissible: false, durationMs: 900 });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status")).toHaveTextContent("Swiped right");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows visual content while announcing its textual meaning", () => {
    // Given: Use this case's inputs and any shared test setup.
    render(<ToastViewport />);
    // When: Exercise `displayToast` with the prepared inputs.
    displayToast({
      messageKey: "studySession.feedback.swipedRight",
      visualContent: <span data-testid="direction-icon">→</span>,
      dismissible: false,
      durationMs: null,
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByTestId("direction-icon")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Information: Swiped right");
    expect(screen.getAllByText("Swiped right")).toHaveLength(1);
  });

  it.each(["neutral", "success", "error"] as const)(
    "automatically dismisses %s notifications after four seconds",
    (tone) => {
      // Given: Prepare `messageKey`, `message` and any shared test state below.
      vi.useFakeTimers();
      render(<ToastViewport />);
      const messageKey = tone === "error" ? "toast.saveFailure" : "account.toast.signInSuccess";
      const message = tone === "error" ? "Unable to save changes. Try again." : "Signed in.";
      displayToast({ messageKey, tone });

      // When: Exercise `act` with the prepared inputs.
      act(() => vi.advanceTimersByTime(3999));
      // Then: Verify the expected result in the assertions below.
      expect(screen.getByText(message)).toBeVisible();
      // When: Exercise `act` with the prepared inputs.
      act(() => vi.advanceTimersByTime(1));
      // Then: Verify the expected result in the assertions below.
      expect(screen.queryByText(message)).not.toBeInTheDocument();
    }
  );

  it("keeps warning notifications until the user dismisses or replaces them", () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ messageKey: "toast.saveFailure", tone: "warning" });

    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(60_000));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Unable to save changes. Try again.")).toBeVisible();
  });

  it("uses an explicit duration override", () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ messageKey: "studySession.feedback.swipedUp", durationMs: 900, dismissible: false });

    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(899));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Swiped up")).toBeVisible();
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(1));
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByText("Swiped up")).not.toBeInTheDocument();
  });

  it("restores focus before replacing a global notification", () => {
    // Given: Prepare `trigger`, `secondDismissButton` and any shared test state below.
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
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(secondDismissButton);
    // Then: Verify the expected result in the assertions below.
    expect(trigger).toHaveFocus();
  });

  it("restores focus when a focused global notification times out", () => {
    // Given: Prepare `trigger` and any shared test state below.
    vi.useFakeTimers();
    render(
      <>
        <button type="button">Show notification</button>
        <ToastViewport />
      </>
    );
    const trigger = screen.getByRole("button", { name: "Show notification" });
    // When: Exercise `trigger.focus` with the prepared inputs.
    trigger.focus();
    displayToast({ messageKey: "account.toast.signInSuccess", durationMs: 1000 });
    screen.getByRole("button", { name: "Dismiss notification" }).focus();

    act(() => vi.advanceTimersByTime(1000));

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByText("Signed in.")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("does not take focus back when focus has moved outside the global notification", () => {
    // Given: Prepare `trigger`, `nextControl` and any shared test state below.
    render(
      <>
        <button type="button">Show notification</button>
        <button type="button">Continue editing</button>
        <ToastViewport />
      </>
    );
    const trigger = screen.getByRole("button", { name: "Show notification" });
    const nextControl = screen.getByRole("button", { name: "Continue editing" });
    // When: Exercise `trigger.focus` with the prepared inputs.
    trigger.focus();
    const id = displayToast({ messageKey: "account.toast.signInSuccess", durationMs: null });
    nextControl.focus();

    act(() => dismissToast(id));

    // Then: Verify the expected result in the assertions below.
    expect(nextControl).toHaveFocus();
  });

  it("shows only the latest notification and ignores an older id", () => {
    // Given: Prepare `firstId`, `secondId`, `secondDismissButton` and any shared test state below.
    render(<ToastViewport />);
    const firstId = displayToast({ messageKey: "account.toast.signInSuccess" });
    const secondId = displayToast({ messageKey: "account.toast.signOutSuccess" });
    const secondDismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    // When: Exercise `secondDismissButton.focus` with the prepared inputs.
    secondDismissButton.focus();

    // Then: Verify the expected result in the assertions below.
    expect(secondId).not.toBe(firstId);
    expect(screen.queryByText("Signed in.")).not.toBeInTheDocument();
    // When: Exercise `act` with the prepared inputs.
    act(() => dismissToast(firstId));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Signed out.")).toBeVisible();
    expect(secondDismissButton).toHaveFocus();
  });

  it("does not let an older timer dismiss a replacement", () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.useFakeTimers();
    render(<ToastViewport />);
    displayToast({ messageKey: "account.toast.signInSuccess", durationMs: 1000 });
    act(() => vi.advanceTimersByTime(500));
    displayToast({ messageKey: "account.toast.signInSuccess", durationMs: 1000 });

    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(500));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Signed in.")).toBeVisible();
    // When: Exercise `act` with the prepared inputs.
    act(() => vi.advanceTimersByTime(500));
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByText("Signed in.")).not.toBeInTheDocument();
  });
});
