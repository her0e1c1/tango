import { actAsync } from "@/test/act";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { replaceAuthSession } from "@/entities/auth";
import { replaceRemoteDecks } from "@/test/entityFixtures";
import { createDeck } from "@/test/factories";
import { subscribeStudyHistory, type StudyHistoryRecord } from "@/entities/study-session";
import { getI18n } from "react-i18next";
import { StudyHistoryPage } from "./StudyHistoryPage";

vi.mock("@/shared/firebase", () => ({ db: {}, auth: {} }));
vi.mock("@/entities/study-session", () => ({ subscribeStudyHistory: vi.fn() }));

const subscriptions: {
  uid: string;
  deckId: string | null;
  metric: string;
  period: { start: number; end: number };
  emit: (records: StudyHistoryRecord[], fromCache: boolean) => void;
  fail: (error: Error) => void;
  stop: ReturnType<typeof vi.fn>;
}[] = [];
const first = createDeck({ id: "first?name=1", name: "First deck", uid: "uid" });
const second = createDeck({ id: "second", name: "Second deck", uid: "uid" });
function renderPage(path = "/study-history") {
  const router = createMemoryRouter(
    [
      { path: "/study-history", element: <StudyHistoryPage /> },
      { path: "/", element: <h1>Decks</h1> },
    ],
    { initialEntries: [path] }
  );
  render(<RouterProvider router={router} />);
  return { router };
}
function emit(records: StudyHistoryRecord[] = [], fromCache = false) {
  act(() => {
    for (const sub of subscriptions.slice(-2)) sub.emit(records, fromCache);
  });
}
function completedRecord(deckId = first.id): StudyHistoryRecord {
  return {
    deckId,
    occurredAt: Date.now(),
    sessionId: deckId,
    startedAt: Date.now(),
    endedAt: Date.now(),
    endReason: "completed",
    cardCount: 3,
  };
}

describe("STUDY-SESSION-09 STUDY-SESSION-10 STUDY-SESSION-11 STUDY-SESSION-12 STUDY-SESSION-13 StudyHistoryPage", () => {
  beforeEach(() => {
    subscriptions.length = 0;
    vi.mocked(subscribeStudyHistory).mockImplementation(({ uid, deckId, metric, period }, next, fail) => {
      const stop = vi.fn();
      subscriptions.push({ uid, deckId, metric, period, emit: next, fail, stop });
      return stop;
    });
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
    replaceRemoteDecks([first, second]);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("waits for both reads, displays cached values, and renders every date", async () => {
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    act(() => subscriptions[0]?.emit([completedRecord()], true));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    act(() => subscriptions[1]?.emit([completedRecord()], true));
    expect(screen.getByRole("table", { hidden: true })).not.toBeVisible();
    await userEvent.setup().click(screen.getByText("Show daily counts · 30 days"));
    expect(screen.getAllByRole("row")).toHaveLength(31);
    const recent = screen.getByRole("region", { name: "Recent sessions" });
    expect(within(recent).getAllByRole("listitem")).toHaveLength(1);
    expect(within(recent).getByRole("heading", { name: first.name })).toBeVisible();
    expect(within(recent).getByText("Completed")).toBeVisible();
    expect(within(recent).getByText("3")).toBeVisible();
    expect(screen.getByText(/Cloud history may be incomplete/)).toBeVisible();
    expect(
      within(
        screen.getByRole("row", {
          name: `${new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date())} 1 1`,
        })
      )
        .getAllByRole("cell")
        .map((cell) => cell.textContent)
    ).toEqual(["1", "1"]);
  });

  it("does not count a failed read as zero and retries both reads with a newly calculated period", async () => {
    const user = userEvent.setup();
    renderPage();
    act(() => {
      subscriptions[0]?.emit([], false);
      subscriptions[1]?.fail(new Error("failed"));
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const previous = subscriptions.slice();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(previous.every((sub) => sub.stop.mock.calls.length === 1)).toBe(true);
    act(() => previous[1]?.emit([completedRecord()], false));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    emit();
    expect(screen.getByText("No study records in this period.")).toBeVisible();
  });

  it("recalculates the shared period on retry after the calendar day changes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 21, 12));
    renderPage();
    act(() => subscriptions[0]?.fail(new Error("failed")));
    vi.setSystemTime(new Date(2026, 9, 21, 12));
    await userEvent.setup().click(screen.getByRole("button", { name: "Retry" }));
    emit([completedRecord()]);
    await userEvent.setup().click(screen.getByText("Show daily counts · 30 days"));
    expect(screen.getByRole("row", { name: "Oct 21, 2026 1 1" })).toBeVisible();
    expect(screen.getByText("Sep 22, 2026 – Oct 21, 2026")).toBeVisible();
  });

  it.each([
    ["days=7", new Date(2026, 8, 16).getTime(), new Date(2026, 8, 23).getTime(), ["2026-09-16", "2026-09-22"]],
    [
      "start=2026-09-20&end=2026-09-21",
      new Date(2026, 8, 20).getTime(),
      new Date(2026, 8, 22).getTime(),
      ["2026-09-20", "2026-09-21"],
    ],
  ])(
    "refreshes the calendar at midnight while preserving custom dates: %s",
    (search, start, end, [startDate, endDate]) => {
      vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
      vi.setSystemTime(new Date(2026, 8, 21, 23, 59, 59));
      renderPage(`/study-history?${search}`);
      emit();
      act(() => vi.advanceTimersByTime(1000));
      expect(subscriptions.slice(-2).every((sub) => sub.period.start === start && sub.period.end === end)).toBe(true);
      emit();
      fireEvent.click(screen.getByRole("button", { name: "Custom range" }));
      expect(screen.getByLabelText("End date")).toHaveAttribute("max", "2026-09-22");
      expect(screen.getByLabelText("Start date")).toHaveValue(startDate);
      expect(screen.getByLabelText("End date")).toHaveValue(endDate);
    }
  );

  it("keeps custom-range results and subscriptions at midnight but retries explicitly", () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date(2026, 8, 21, 23, 59, 59));
    renderPage("/study-history?start=2026-09-20&end=2026-09-21");
    emit([completedRecord()]);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: first.name })).toBeVisible();
    expect(screen.getByLabelText("End date")).toHaveAttribute("max", "2026-09-22");
    expect(subscriptions).toHaveLength(2);
    expect(subscriptions.every((sub) => sub.stop.mock.calls.length === 0)).toBe(true);
    act(() => subscriptions[0]?.fail(new Error("failed")));
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(subscriptions).toHaveLength(4);
    expect(subscriptions.slice(0, 2).every((sub) => sub.stop.mock.calls.length === 1)).toBe(true);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    emit();
    expect(screen.getByText("No study records in this period.")).toBeVisible();
    expect(screen.getByLabelText("Start date")).toHaveValue("2026-09-20");
    expect(screen.getByLabelText("End date")).toHaveValue("2026-09-21");
  });

  it("uses the URL for filtering, back/forward, and ignores previous deck and UID callbacks", async () => {
    const user = userEvent.setup();
    const { router } = renderPage();
    emit([completedRecord(), completedRecord(second.id)]);
    const previous = subscriptions.slice();
    await user.selectOptions(screen.getByRole("combobox"), first.id);
    expect(new URLSearchParams(router.state.location.search).get("deckId")).toBe(first.id);
    expect(subscriptions.slice(-2).every((sub) => sub.deckId === first.id)).toBe(true);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    act(() =>
      previous.forEach((sub) => {
        sub.emit([completedRecord()], false);
      })
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    emit([completedRecord(), completedRecord(second.id)]);
    await user.click(screen.getByText("Show daily counts · 30 days"));
    expect(
      within(
        screen.getByRole("row", {
          name: `${new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date())} 1 1`,
        })
      )
        .getAllByRole("cell")
        .map((cell) => cell.textContent)
    ).toEqual(["1", "1"]);
    await actAsync(() => router.navigate(-1));
    expect(screen.getByRole("combobox")).toHaveValue("");
    await actAsync(() => router.navigate(1));
    expect(screen.getByRole("combobox")).toHaveValue(first.id);
    const oldUser = subscriptions.slice(-2);
    act(() => replaceAuthSession({ status: "authenticated", uid: "other", isAnonymous: true, displayName: null }));
    act(() =>
      oldUser.forEach((sub) => {
        sub.emit([completedRecord()], false);
      })
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(subscriptions.slice(-2).every((sub) => sub.uid === "other")).toBe(true);
    await actAsync(() => router.navigate("/"));
    expect(subscriptions.every((sub) => sub.stop.mock.calls.length === 1)).toBe(true);
  });

  it.each(["missing", ""])(
    "waits for Deck initialization before declaring URL selection %s unavailable",
    async (deckId) => {
      act(() => replaceAuthSession({ status: "initializing" }));
      const { router } = renderPage(`/study-history?deckId=${deckId}`);
      expect(screen.getByRole("status")).toHaveTextContent("Loading");
      act(() => replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null }));
      expect(screen.getByRole("status")).toHaveTextContent("The selected deck is unavailable.");
      expect(router.state.location.search).toBe(`?deckId=${deckId}`);
      expect(screen.getByRole("combobox")).toHaveDisplayValue("The selected deck is unavailable.");
      await userEvent.setup().click(screen.getByRole("button", { name: "All decks" }));
      expect(router.state.location.search).toBe("");
    }
  );

  it("removes deleted Deck counts and translates UI without changing the selected Deck", async () => {
    renderPage(`/study-history?deckId=${encodeURIComponent(first.id)}`);
    emit([completedRecord()]);
    await actAsync(() => getI18n().changeLanguage("ja"));
    expect(screen.getByRole("heading", { name: "学習記録" })).toBeVisible();
    expect(screen.getByRole("combobox")).toHaveValue(first.id);
    expect(screen.getByRole("region", { name: "最近のセッション" })).toHaveTextContent("完了");
    act(() => replaceRemoteDecks([second]));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("対象のデッキを表示できません");
  });

  it("selects 7 and 90 days, keeps all daily values, and ignores delayed results from the previous period", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 22, 12));
    const user = userEvent.setup();
    renderPage();
    emit();
    const old = subscriptions.slice();
    await user.click(screen.getByRole("button", { name: "90 days" }));
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    act(() =>
      old.forEach((sub) => {
        sub.emit([completedRecord()], false);
      })
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const older = {
      ...completedRecord(),
      sessionId: "older",
      startedAt: new Date(2026, 7, 1, 12).getTime(),
      endedAt: new Date(2026, 7, 1, 12).getTime(),
      occurredAt: new Date(2026, 7, 1, 12).getTime(),
    };
    emit([older, completedRecord()]);
    expect(screen.getByText("Jun 25, 2026 – Sep 22, 2026")).toBeVisible();
    expect(screen.getByText("Study counts per 7 days")).toBeVisible();
    expect(screen.getAllByRole("definition")[0]).toHaveTextContent("2");
    await user.click(screen.getByText("Show daily counts · 90 days"));
    await user.click(screen.getByRole("button", { name: "Older dates" }));
    expect(screen.getByRole("row", { name: "Aug 1, 2026 1 1" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Older dates" }));
    expect(screen.getByRole("row", { name: "Jun 25, 2026 0 0" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Older dates" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "7 days" }));
    emit([older, completedRecord()]);
    expect(screen.getAllByRole("definition")[0]).toHaveTextContent("1");
    await user.click(screen.getByText("Show daily counts · 7 days"));
    expect(screen.getAllByRole("row")).toHaveLength(8);
    expect(screen.getByRole("row", { name: "Sep 16, 2026 0 0" })).toBeVisible();
  });

  it("applies inclusive custom dates, preserves them on Deck changes and retry, and restores URL navigation", async () => {
    const user = userEvent.setup();
    const { router } = renderPage();
    emit();
    await user.click(screen.getByRole("button", { name: "Custom range" }));
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-01-01" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-01-02" } });
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(router.state.location.search).toBe("?start=2026-01-01&end=2026-01-02");
    await waitFor(() =>
      expect(subscriptions.at(-1)?.period).toEqual({
        start: new Date(2026, 0, 1).getTime(),
        end: new Date(2026, 0, 3).getTime(),
      })
    );
    const boundary = (time: number): StudyHistoryRecord => ({
      ...completedRecord(),
      startedAt: time,
      endedAt: time,
      occurredAt: time,
      sessionId: String(time),
    });
    emit([
      boundary(new Date(2026, 0, 1).getTime()),
      boundary(new Date(2026, 0, 2, 23, 59, 59, 999).getTime()),
      boundary(new Date(2026, 0, 3).getTime()),
    ]);
    expect(screen.getAllByRole("definition")[0]).toHaveTextContent("2");
    await user.click(screen.getByText("Show daily counts · 2 days"));
    expect(screen.getByRole("row", { name: "Jan 1, 2026 1 1" })).toBeVisible();
    expect(screen.getByRole("row", { name: "Jan 2, 2026 1 1" })).toBeVisible();
    await user.selectOptions(screen.getByRole("combobox"), first.id);
    expect(new URLSearchParams(router.state.location.search).get("start")).toBe("2026-01-01");
    act(() => subscriptions.at(-1)?.fail(new Error("failed")));
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(subscriptions.at(-1)?.period).toEqual({
      start: new Date(2026, 0, 1).getTime(),
      end: new Date(2026, 0, 3).getTime(),
    });
    await user.click(screen.getByRole("button", { name: "7 days" }));
    await actAsync(() => router.navigate(-1));
    expect(screen.getByLabelText("Start date")).toHaveValue("2026-01-01");
    expect(screen.getByLabelText("End date")).toHaveValue("2026-01-02");
    expect(screen.getByRole("combobox")).toHaveValue(first.id);
    await actAsync(() => router.navigate(1));
    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute("aria-pressed", "true");
  });

  it("rejects invalid drafts without replacing the displayed period", async () => {
    const user = userEvent.setup();
    const { router } = renderPage("/study-history?start=2026-01-01&end=2026-01-02");
    emit();
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2025-12-31" } });
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByRole("alert")).toHaveTextContent("End date must be on or after start date.");
    expect(router.state.location.search).toBe("?start=2026-01-01&end=2026-01-02");
    expect(screen.getByText("Jan 1, 2026 – Jan 2, 2026")).toBeVisible();
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "9999-01-01" } });
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByRole("alert")).toHaveTextContent("End date must be today or earlier.");
  });

  it.each(["days=invalid", "start=2026-02-30&end=2026-03-01", "start=2026-01-01", "start=2026-01-02&end=2026-01-01"])(
    "does not substitute a default period for an invalid URL (%s)",
    async (query) => {
      renderPage(`/study-history?${query}`);
      expect(screen.getByRole("alert")).toHaveTextContent("This date range is invalid.");
      expect(subscriptions).toHaveLength(0);
      await userEvent.setup().click(screen.getByRole("button", { name: "30 days" }));
      emit();
      expect(screen.getByText("No study records in this period.")).toBeVisible();
    }
  );
});
