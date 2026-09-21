import { actAsync } from "@/test/act";
import { act, render, screen, within } from "@testing-library/react";
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
  return { deckId, startedAt: Date.now(), endedAt: Date.now(), endReason: "completed" };
}

describe("HISTORY-01 HISTORY-02 HISTORY-03 HISTORY-04 StudyHistoryPage", () => {
  beforeEach(() => {
    subscriptions.length = 0;
    vi.mocked(subscribeStudyHistory).mockImplementation(({ uid, deckId, metric }, next, fail) => {
      const stop = vi.fn();
      subscriptions.push({ uid, deckId, metric, emit: next, fail, stop });
      return stop;
    });
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
    replaceRemoteDecks([first, second]);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("waits for both reads, displays cached values, and renders every date", () => {
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    act(() => subscriptions[0]?.emit([completedRecord()], true));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    act(() => subscriptions[1]?.emit([completedRecord()], true));
    expect(screen.getAllByRole("row")).toHaveLength(31);
    expect(screen.getByText(/Cloud history may be incomplete/)).toBeVisible();
    expect(
      within(
        screen.getByRole("row", {
          name: `${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date())} 1 1`,
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
    expect(screen.getByRole("row", { name: "Oct 21 1 1" })).toBeVisible();
    expect(screen.getByText("Sep 22, 2026 – Oct 21, 2026")).toBeVisible();
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
    expect(
      within(
        screen.getByRole("row", {
          name: `${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date())} 1 1`,
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
    act(() => replaceRemoteDecks([second]));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("対象のデッキを表示できません");
  });
});
