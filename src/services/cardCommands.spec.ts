import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  logicalRemove: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/adapters/firestore/card", () => ({
  create: mocks.create,
  update: mocks.update,
  logicalRemove: mocks.logicalRemove,
  upsert: mocks.upsert,
}));

import { cardCommands } from "@/services/cardCommands";

const createCard = (overrides: Partial<Card> = {}) => createCardFixture({ uid: "uid-a", ...overrides });

describe("card commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue("created");
    mocks.update.mockResolvedValue(undefined);
    mocks.logicalRemove.mockResolvedValue(undefined);
    mocks.upsert.mockResolvedValue("upserted");
  });

  it("rejects missing users and mismatched owners before writing", async () => {
    await expect(cardCommands.create("", createCard())).rejects.toThrow("confirmed user");
    await expect(cardCommands.update("uid-a", createCard({ uid: "uid-b" }))).rejects.toThrow("owner does not match");

    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("serializes writes to the same Card", async () => {
    let finishCreate!: () => void;
    mocks.create.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        finishCreate = () => resolve("created");
      })
    );
    const card = createCard({ id: "card" });

    const create = cardCommands.create("uid-a", card);
    const update = cardCommands.update("uid-a", { ...card, score: 2 });
    await vi.waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.update).not.toHaveBeenCalled();

    finishCreate();
    await Promise.all([create, update]);
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it("reports only failed bulk upserts", async () => {
    const first = createCard({ id: "first" });
    const second = createCard({ id: "second" });
    mocks.upsert.mockResolvedValueOnce("first").mockRejectedValueOnce(new Error("failed"));

    await expect(cardCommands.bulkUpsert("uid-a", [first, second])).rejects.toMatchObject({
      failedIds: [second.id],
      message: "1 of 2 Card writes failed",
    });
  });

  it("logically removes a Card by id", async () => {
    await cardCommands.remove("uid-a", "card");

    expect(mocks.logicalRemove).toHaveBeenCalledExactlyOnceWith("card");
  });
});
