import "@/test/mockFirestorePersistence";
import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { calculateFsrsState } from "@/entities/card";
import { getMemoryState } from "../model/queries/getMemoryState";
import { MemoryState } from "./MemoryState";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("CARD-VIEW-06 CARD-VIEW-08 memory presentation", () => {
  it("describes recall, reference time, saved deadline, and the target even when markers coincide", () => {
    // Given: Prepare `at`, `schedule` and any shared test state below.
    const at = Date.UTC(2026, 8, 21);
    const schedule = calculateFsrsState(null, "good", at);
    // When: Exercise `render` with the prepared inputs.
    render(<MemoryState memory={getMemoryState(schedule, schedule.dueAt)} />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
    expect(screen.getByText(/Estimated recall:/)).toBeVisible();
    expect(screen.getByText(/As of /, { selector: "p" })).toBeVisible();
    expect(screen.getByText(/Review due/)).toBeVisible();
    expect(screen.getByText("Last review")).toBeVisible();
    expect(screen.getByText("Target retention")).toBeVisible();
    expect(screen.getByText(/FSRS estimates/, { selector: "p" })).toBeVisible();
  });
  it("keeps the rated summary and curve visible when returning an hour after the first review", () => {
    // Given: Prepare `reviewedAt`, `schedule` and any shared test state below.
    const reviewedAt = Date.UTC(2026, 8, 21);
    const schedule = calculateFsrsState(null, "good", reviewedAt);
    // When: Exercise `render` with the prepared inputs.
    render(<MemoryState memory={getMemoryState(schedule, Date.UTC(2026, 8, 21, 1))} />);

    const chart = screen.getByRole("img", { name: /Forgetting curve/ });
    // Then: Verify the expected result in the assertions below.
    expect(chart).toBeVisible();
    expect(screen.getByText(/Estimated recall:/)).toBeVisible();
    expect(screen.getByText(/As of /, { selector: "p" })).toBeVisible();
    expect(screen.getByText("Last review")).toBeVisible();
    expect(screen.getByText("Target retention")).toBeVisible();
    expect(within(chart).getByText("Snapshot")).toBeVisible();
    expect(within(chart).getByText("Next review")).toBeVisible();
  });
  it("shows an empty state with no curve or invented percentage", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<MemoryState memory={undefined} />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("region", { name: "Memory state" })).toHaveTextContent("No FSRS memory state yet.");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
