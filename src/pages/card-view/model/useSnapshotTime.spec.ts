import "@/test/mockFirestorePersistence";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateFsrsState } from "@/entities/card";
import { useSnapshotTime } from "./useSnapshotTime";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("CARD-VIEW-06 memory reference time", () => {
  afterEach(() => vi.restoreAllMocks());
  it("holds a snapshot until the card, schedule, or foreground changes", () => {
    const at = Date.UTC(2026, 8, 21);
    const clock = vi.spyOn(Date, "now").mockReturnValue(at);
    const schedule = calculateFsrsState(null, "good", at);
    const { result, rerender } = renderHook(({ id, value }) => useSnapshotTime(id, value), {
      initialProps: { id: "first", value: schedule },
    });
    expect(result.current).toBe(at);
    clock.mockReturnValue(at + 60_000);
    rerender({ id: "first", value: schedule });
    expect(result.current).toBe(at);
    rerender({ id: "first", value: structuredClone(schedule) });
    expect(result.current).toBe(at);
    rerender({ id: "second", value: schedule });
    expect(result.current).toBe(at + 60_000);
    clock.mockReturnValue(at + 120_000);
    rerender({ id: "second", value: calculateFsrsState(schedule, "good", at + 120_000) });
    expect(result.current).toBe(at + 120_000);
    clock.mockReturnValue(at + 180_000);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current).toBe(at + 120_000);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current).toBe(at + 180_000);
  });
});
