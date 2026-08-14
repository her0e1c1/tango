import type { RemoteSnapshot } from "@/shared/api";

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentData, Query } from "firebase/firestore";

import { subscribeReads, type SubscribeReadsOptions } from "./subscribeReads";

type TestItem = { id: string; active: boolean; label: string };
type TestDocument = { id: string; data: () => Record<string, unknown> };
type TestSnapshot = {
  docs: TestDocument[];
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
  metadata: TestSnapshot["metadata"] = { fromCache: false, hasPendingWrites: false }
): TestSnapshot => ({ docs, metadata });

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
  const onSnapshot = vi.fn<(received: RemoteSnapshot<TestItem>) => void>();
  const onError = vi.fn<(error: Error) => void>();
  const options: SubscribeReadsOptions<TestItem> = { query, mapDocument, isActive, onSnapshot, onError };
  return { options, query, onSnapshot, onError };
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.next = undefined;
  mocks.error = undefined;
});

describe("Firestore subscriptions", () => {
  it("publishes the active current query result and returns the unsubscribe callback", () => {
    const harness = createHarness();

    const unsubscribe = subscribeReads(harness.options);
    mocks.next?.(
      snapshot([document("active", { active: true, label: "Active" }), document("inactive", { active: false })], {
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
      itemsById: { active: { id: "active", active: true, label: "Active" } },
      syncStatus: "pending",
    });
  });

  it("replaces the full result on every snapshot", () => {
    const harness = createHarness();
    subscribeReads(harness.options);
    mocks.next?.(snapshot([document("old", { active: true })]));

    mocks.next?.(snapshot([document("current", { active: true, label: "Current" })]));

    expect(harness.onSnapshot).toHaveBeenLastCalledWith({
      itemsById: { current: { id: "current", active: true, label: "Current" } },
      syncStatus: "synced",
    });
  });

  it.each([
    [{ fromCache: true, hasPendingWrites: false }, "cached"],
    [{ fromCache: false, hasPendingWrites: true }, "pending"],
    [{ fromCache: false, hasPendingWrites: false }, "synced"],
  ] as const)("derives %s metadata as %s", (metadata, syncStatus) => {
    const harness = createHarness();
    subscribeReads(harness.options);
    mocks.next?.(snapshot([], metadata));
    expect(harness.onSnapshot).toHaveBeenCalledWith({ itemsById: {}, syncStatus });
  });

  it("does not publish a partial result when mapping fails", () => {
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

  it("forwards listener errors", () => {
    const harness = createHarness();
    subscribeReads(harness.options);
    const error = new Error("Listener failed");
    mocks.error?.(error);
    expect(harness.onError).toHaveBeenCalledWith(error);
  });
});
