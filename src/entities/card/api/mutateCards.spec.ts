import type { CardMutation } from "../model/types";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

const writers = vi.hoisted(() => ({ createCard: vi.fn(), editCard: vi.fn() }));

vi.mock("./firestore", () => writers);

import { type CardBulkMutationError, mutateCards } from "./mutateCards";

describe("mutateCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writers.createCard.mockResolvedValue(undefined);
    writers.editCard.mockResolvedValue(undefined);
  });

  it("executes each explicit Card mutation", async () => {
    const created = createCardFixture({ id: "created" });
    const edited = createCardFixture({ id: "edited" });
    const mutations = [
      { kind: "create", card: created },
      { kind: "edit", card: edited },
    ] satisfies CardMutation[];

    await mutateCards("uid-a", mutations);

    expect(writers.createCard).toHaveBeenCalledWith("uid-a", created);
    expect(writers.editCard).toHaveBeenCalledWith("uid-a", edited);
  });

  it("reports every failed Card while allowing other writes to finish", async () => {
    const first = createCardFixture({ id: "first" });
    const second = createCardFixture({ id: "second" });
    writers.createCard.mockRejectedValueOnce(new Error("create failed"));
    writers.editCard.mockRejectedValueOnce(new Error("edit failed"));

    await expect(
      mutateCards("uid-a", [
        { kind: "create", card: first },
        { kind: "edit", card: second },
      ])
    ).rejects.toMatchObject({
      failedIds: [first.id, second.id],
      message: "2 of 2 Card writes failed",
    } satisfies Partial<CardBulkMutationError>);
  });
});
