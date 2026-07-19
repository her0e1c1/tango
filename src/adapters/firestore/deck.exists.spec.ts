import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  doc: vi.fn(() => "deck-ref"),
  getDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: mocks.doc,
  getDoc: mocks.getDoc,
}));
vi.mock("@/adapters/firestore/runtime", () => ({ getDb: () => "db" }));

import { exists } from "@/adapters/firestore/deck";

describe("firestore/deck.exists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([true, false])("returns the snapshot exists value %s", async (expected) => {
    mocks.getDoc.mockResolvedValue({ exists: () => expected });

    await expect(exists("deck-id")).resolves.toBe(expected);
  });

  it.each([
    "unavailable",
    "permission-denied",
    "unauthenticated",
  ])("rejects the original %s read error", async (code) => {
    const error = Object.assign(new Error(code), { code });
    mocks.getDoc.mockRejectedValue(error);

    await expect(exists("deck-id")).rejects.toBe(error);
  });
});
