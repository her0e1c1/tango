import type { RemoteSubscriptionProps } from "@/shared/api";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StudyProgressRead } from "./subscribeStudyProgressReads";

const mocks = vi.hoisted(() => ({
  collection: vi.fn((...parts: unknown[]) => parts),
  query: vi.fn((...parts: unknown[]) => parts),
  where: vi.fn((...parts: unknown[]) => parts),
  subscribeReads: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  query: mocks.query,
  where: mocks.where,
}));
vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
  getDb: () => "db",
  subscribeReads: mocks.subscribeReads,
}));

import { subscribeStudyProgressReads } from "./subscribeStudyProgressReads";

interface CapturedOptions {
  query: unknown;
  mapDocument: (id: string, data: unknown) => StudyProgressRead;
  isActive: (progress: StudyProgressRead) => boolean;
  keyOf: (progress: StudyProgressRead) => string;
  onSnapshot: RemoteSubscriptionProps<StudyProgressRead>["onSnapshot"];
  onError: RemoteSubscriptionProps<StudyProgressRead>["onError"];
}

const cardDocument = (deletedAt: number | null = null) => ({
  id: "ignored-document-id",
  frontText: "Front",
  backText: "Back",
  tags: [],
  uniqueKey: "unique-key",
  deckId: "deck-a",
  uid: "uid-a",
  createdAt: 1,
  updatedAt: 2,
  deletedAt,
  score: 3,
  numberOfSeen: 4,
});

describe("subscribeStudyProgressReads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscribeReads.mockReturnValue(mocks.unsubscribe);
  });

  it("constructs a UID-scoped StudyProgress query and forwards callbacks", () => {
    const props: RemoteSubscriptionProps<StudyProgressRead> = {
      uid: "uid-a",
      onSnapshot: vi.fn(),
      onError: vi.fn(),
    };

    expect(subscribeStudyProgressReads(props)).toBe(mocks.unsubscribe);
    expect(mocks.collection).toHaveBeenCalledWith("db", "card");
    expect(mocks.where).toHaveBeenCalledWith("uid", "==", "uid-a");

    const options = mocks.subscribeReads.mock.calls[0]?.[0] as CapturedOptions;
    expect(options.query).toEqual([
      ["db", "card"],
      ["uid", "==", "uid-a"],
    ]);
    expect(options.onSnapshot).toBe(props.onSnapshot);
    expect(options.onError).toBe(props.onError);
  });

  it("maps progress by Card ID and excludes soft-deleted Cards", () => {
    subscribeStudyProgressReads({ uid: "uid-a", onSnapshot: vi.fn(), onError: vi.fn() });

    const options = mocks.subscribeReads.mock.calls[0]?.[0] as CapturedOptions;
    const active = options.mapDocument("card-a", cardDocument());
    const deleted = options.mapDocument("card-b", cardDocument(3));

    expect(active).toEqual({
      cardId: "card-a",
      score: 3,
      numberOfSeen: 4,
      deletedAt: null,
    });
    expect(options.keyOf(active)).toBe("card-a");
    expect(options.isActive(active)).toBe(true);
    expect(options.isActive(deleted)).toBe(false);
  });
});
