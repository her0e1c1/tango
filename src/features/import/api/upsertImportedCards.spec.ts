import type { Card } from "@/entities/card";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REMOTE_WRITE_TIMEOUT_MS } from "@/shared/lib/remoteWrite";
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

  afterEach(() => vi.useRealTimers());

  it("reports only failed Card writes", async () => {
    const first = createCard({ id: "first" });
    const second = createCard({ id: "second" });
    mocks.upsert.mockResolvedValueOnce("first").mockRejectedValueOnce(new Error("failed"));

    await expect(upsertImportedCards("uid-a", [first, second])).rejects.toMatchObject({
      failedIds: [second.id],
      message: "1 of 2 Card writes failed",
    });
  });

  it("reports stalled writes instead of leaving the import pending", async () => {
    vi.useFakeTimers();
    const card = createCard({ id: "stalled" });
    mocks.upsert.mockReturnValueOnce(new Promise(() => undefined));
    const operation = upsertImportedCards("uid-a", [card]);
    const assertion = expect(operation).rejects.toMatchObject({ failedIds: [card.id] });

    await vi.advanceTimersByTimeAsync(REMOTE_WRITE_TIMEOUT_MS);
    await assertion;
  });
});
