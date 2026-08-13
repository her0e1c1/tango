import type { Card } from "@/entities/card";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("./firestore", () => ({
  createCardDocument: mocks.create,
  updateCardDocument: mocks.update,
  removeCardDocument: mocks.remove,
}));

import { cardCommands } from "./cardCommands";

const createCard = (overrides: Partial<Card> = {}) => createCardFixture({ uid: "uid-a", ...overrides });

describe("cardCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue("created");
    mocks.update.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
  });

  it("rejects missing users and mismatched owners before writing", async () => {
    await expect(cardCommands.create("", createCard())).rejects.toThrow("confirmed user");
    await expect(cardCommands.update("uid-a", createCard({ uid: "uid-b" }))).rejects.toThrow("owner does not match");
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("starts writes to the same Card independently", async () => {
    let finishCreate!: () => void;
    mocks.create.mockReturnValueOnce(new Promise<string>((resolve) => (finishCreate = () => resolve("created"))));
    const card = createCard({ id: "card" });

    const create = cardCommands.create("uid-a", card);
    const update = cardCommands.update("uid-a", { ...card, score: 2 });
    await vi.waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());

    finishCreate();
    await Promise.all([create, update]);
  });
});
