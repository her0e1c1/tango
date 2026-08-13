import type { RemoteSnapshot } from "@/shared/api";

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentData, Query } from "firebase/firestore";

import { subscribeReads, type SubscribeReadsOptions } from "./subscribeReads";

type TestItem = { id: string; active: boolean; label: string };
type TestDocument = { id: string; data: () => Record<string, unknown> };
type TestChange = { type: "added" | "modified" | "removed"; doc: TestDocument };
type TestSnapshot = {
  docs: TestDocument[];
  docChanges: () => TestChange[];
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
};

const mocks = vi.hoisted(() => ({
  next: undefined as ((snapshot: TestSnapshot) => void) | undefined,
  error: undefined as ((error: Error) => void) | undefined,
  unsubscribe: vi.fn(),
  onSnapshot: vi.fn(
    (_query: unknown, _options: unknown, next: (snapshot: TestSnapshot) => void, error: (received: Error) => void) => {
      mocks.next = next;
      mocks.error = error;
      return mocks.unsubscribe;
    }
  ),
}));

vi.mock("firebase/firestore", () => ({ onSnapshot: mocks.onSnapshot }));

const document = (id: string, data: Record<string, unknown>): TestDocument => ({ id, data: () => data });

const snapshot = (
  docs: TestDocument[],
  changes: TestChange[] = [],
  metadata: TestSnapshot["metadata"] = { fromCache: false, hasPendingWrites: false }
): TestSnapshot => ({ docs, docChanges: () => changes, metadata });

const createHarness = () => {
  const query = {} as Query;
  const mapDocument = vi.fn((id: string, data: DocumentData): TestItem => {
    if (data.invalid === true) throw new Error(`Invalid ${id}`);
    return {
      id,
      active: data.active === true,
      label: typeof data.label === "string" ? data.label : "",
    };
  });
  const isActive = vi.fn((item: TestItem) => item.active);
  const keyOf = vi.fn((item: TestItem) => item.id);
  const onSnapshot = vi.fn<(received: RemoteSnapshot<TestItem>) => void>();
  const onError = vi.fn<(error: Error) => void>();
  const options: SubscribeReadsOptions<TestItem> = { query, mapDocument, isActive, keyOf, onSnapshot, onError };
  return { options, query, mapDocument, isActive, keyOf, onSnapshot, onError };
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.next = undefined;
  mocks.error = undefined;
});

describe("Firestore read subscriptions", () => {
  it("publishes an active initial replacement and returns the unsubscribe callback", () => {
    const harness = createHarness();

    const unsubscribe = subscribeReads(harness.options);
    mocks.next?.(
      snapshot([document("active", { active: true, label: "Active" }), document("inactive", { active: false })], [], {
        fromCache: true,
        hasPendingWrites: true,
      })
    );

    expect(mocks.onSnapshot).toHaveBeenCalledWith(
      harness.query,
      { includeMetadataChanges: true },
      expect.any(Function),
      harness.onError
    );
    expect(unsubscribe).toBe(mocks.unsubscribe);
    expect(harness.onSnapshot).toHaveBeenCalledWith({
      type: "replace",
      items: [{ id: "active", active: true, label: "Active" }],
      metadata: { fromCache: true, hasPendingWrites: true },
    });
  });

  it("classifies incremental changes with the injected active policy", () => {
    const harness = createHarness();
    subscribeReads(harness.options);
    mocks.next?.(snapshot([]));
    harness.onSnapshot.mockClear();

    mocks.next?.(
      snapshot(
        [],
        [
          { type: "added", doc: document("added", { active: true, label: "Added" }) },
          { type: "modified", doc: document("modified", { active: true, label: "Modified" }) },
          { type: "modified", doc: document("inactive", { active: false }) },
          { type: "removed", doc: document("removed", { active: true }) },
        ],
        { fromCache: false, hasPendingWrites: true }
      )
    );

    expect(harness.onSnapshot).toHaveBeenCalledWith({
      type: "change",
      event: {
        added: [{ id: "added", active: true, label: "Added" }],
        modified: [{ id: "modified", active: true, label: "Modified" }],
        removed: ["inactive", "removed"],
      },
      metadata: { fromCache: false, hasPendingWrites: true },
    });
  });

  it("publishes metadata-only snapshots", () => {
    const harness = createHarness();
    subscribeReads(harness.options);
    mocks.next?.(snapshot([], [], { fromCache: true, hasPendingWrites: true }));
    harness.onSnapshot.mockClear();

    mocks.next?.(snapshot([], [], { fromCache: false, hasPendingWrites: false }));

    expect(harness.onSnapshot).toHaveBeenCalledWith({
      type: "change",
      event: { added: [], modified: [], removed: [] },
      metadata: { fromCache: false, hasPendingWrites: false },
    });
  });

  it("does not publish a partial initial replacement when mapping fails", () => {
    const harness = createHarness();
    subscribeReads(harness.options);

    expect(() =>
      mocks.next?.(
        snapshot([document("valid", { active: true }), document("invalid", { active: true, invalid: true })])
      )
    ).not.toThrow();

    expect(harness.onSnapshot).not.toHaveBeenCalled();
    expect(harness.onError).toHaveBeenCalledWith(new Error("Invalid invalid"));
  });

  it("does not publish a partial delta when mapping fails", () => {
    const harness = createHarness();
    subscribeReads(harness.options);
    mocks.next?.(snapshot([]));
    harness.onSnapshot.mockClear();

    mocks.next?.(
      snapshot(
        [],
        [
          { type: "added", doc: document("valid", { active: true }) },
          { type: "modified", doc: document("invalid", { active: true, invalid: true }) },
        ]
      )
    );

    expect(harness.onSnapshot).not.toHaveBeenCalled();
    expect(harness.onError).toHaveBeenCalledWith(new Error("Invalid invalid"));
  });

  it("maps and validates removed changes before publishing their ids", () => {
    const harness = createHarness();
    subscribeReads(harness.options);
    mocks.next?.(snapshot([]));
    harness.onSnapshot.mockClear();

    mocks.next?.(snapshot([], [{ type: "removed", doc: document("invalid-removed", { invalid: true }) }]));

    expect(harness.mapDocument).toHaveBeenLastCalledWith("invalid-removed", { invalid: true });
    expect(harness.onSnapshot).not.toHaveBeenCalled();
    expect(harness.onError).toHaveBeenCalledWith(new Error("Invalid invalid-removed"));
  });

  it("forwards listener errors", () => {
    const harness = createHarness();
    subscribeReads(harness.options);
    const error = new Error("Listener failed");

    mocks.error?.(error);

    expect(harness.onError).toHaveBeenCalledWith(error);
  });
});
