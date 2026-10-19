import "@/test/mockFirestorePersistence";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateFsrsState } from "@/entities/card";
import { useSnapshotTime } from "./useSnapshotTime";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("CARD-VIEW-09 memory reference time", () => {
  afterEach(() => vi.restoreAllMocks());
  it("holds a snapshot until the card, schedule, or foreground changes", () => {
    // Given: Prepare `at`, `clock`, `schedule` and any shared test state below.
    const at = Date.UTC(2026, 8, 21);
    const clock = vi.spyOn(Date, "now").mockReturnValue(at);
    const schedule = calculateFsrsState(null, "good", at);
    const { result, rerender } = renderHook(({ id, value }) => useSnapshotTime(id, value), {
      initialProps: { id: "first", value: schedule },
    });
    expect(result.current).toBe(at);
    // When: Advance wall time and rerender the same Card and schedule.
    clock.mockReturnValue(at + 60_000);
    rerender({ id: "first", value: schedule });
    // Then: Retain the existing reference time.
    expect(result.current).toBe(at);
    // When: Rerender with an equivalent schedule object.
    rerender({ id: "first", value: structuredClone(schedule) });
    // Then: Object identity alone does not refresh the reference time.
    expect(result.current).toBe(at);
    // When: Select a different Card with the same schedule.
    rerender({ id: "second", value: schedule });
    // Then: Capture the current wall time for the newly selected Card.
    expect(result.current).toBe(at + 60_000);
    // When: Advance time and replace the selected Card's schedule.
    clock.mockReturnValue(at + 120_000);
    rerender({ id: "second", value: calculateFsrsState(schedule, "good", at + 120_000) });
    // Then: Refresh the reference time for the changed schedule.
    expect(result.current).toBe(at + 120_000);
    clock.mockReturnValue(at + 180_000);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    // When: Exercise `act` with the prepared inputs.
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    // Then: Verify the expected result in the assertions below.
    expect(result.current).toBe(at + 120_000);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    // When: Exercise `act` with the prepared inputs.
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    // Then: Verify the expected result in the assertions below.
    expect(result.current).toBe(at + 180_000);
  });
});
