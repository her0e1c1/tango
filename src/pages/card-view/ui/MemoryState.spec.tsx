import "@/test/mockFirestorePersistence";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { calculateFsrsState } from "@/entities/card-study-state";
import { getMemoryState } from "../model/queries/getMemoryState";
import { MemoryState } from "./MemoryState";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("CARD-VIEW-06 memory presentation", () => {
  it("describes recall, reference time, saved deadline, and the target even when markers coincide", () => {
    const at = Date.UTC(2026, 8, 21);
    const schedule = calculateFsrsState(null, "good", at);
    render(<MemoryState memory={getMemoryState(schedule, schedule.dueAt)} />);
    expect(screen.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
    expect(screen.getByText(/Estimated recall:/)).toBeVisible();
    expect(screen.getByText(/As of /, { selector: "p" })).toBeVisible();
    expect(screen.getByText(/Review due/)).toBeVisible();
    expect(screen.getByText("Last review")).toBeVisible();
    expect(screen.getByText("Target retention")).toBeVisible();
    expect(screen.getByText(/FSRS estimates/, { selector: "p" })).toBeVisible();
  });
  it("shows an empty state with no curve or invented percentage", () => {
    render(<MemoryState memory={undefined} />);
    expect(screen.getByRole("region", { name: "Memory state" })).toHaveTextContent("No FSRS memory state yet.");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
