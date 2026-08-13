import type { Card } from "@/entities/card";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({ upsert: vi.fn() }));

vi.mock("./cardFirestore", () => ({
  upsertCardDocument: mocks.upsert,
}));

import { upsertImportedCards } from "./upsertImportedCards";

const createCard = (overrides: Partial<Card> = {}) => createCardFixture({ uid: "uid-a", ...overrides });

describe("upsertImportedCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upsert.mockResolvedValue("upserted");
  });

  it("reports only failed Card writes", async () => {
    const first = createCard({ id: "first" });
    const second = createCard({ id: "second" });
    mocks.upsert.mockResolvedValueOnce("first").mockRejectedValueOnce(new Error("failed"));

    await expect(upsertImportedCards("uid-a", [first, second])).rejects.toMatchObject({
      failedIds: [second.id],
      message: "1 of 2 Card writes failed",
    });
  });
});
