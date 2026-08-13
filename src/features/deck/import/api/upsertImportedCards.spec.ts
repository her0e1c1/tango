import type { Card } from "@/entities/card";

import { describe, expect, it } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

import { upsertImportedCards } from "./upsertImportedCards";

const createCard = (overrides: Partial<Card> = {}) => createCardFixture({ uid: "uid-a", ...overrides });
const writers = {
  createCard: () => Promise.resolve(),
  editCard: () => Promise.resolve(),
};

describe("upsertImportedCards", () => {
  it("rejects missing users and Cards owned by another user", async () => {
    await expect(upsertImportedCards("", [createCard()], [], writers)).rejects.toThrow("confirmed user");
    await expect(upsertImportedCards("uid-a", [createCard({ uid: "uid-b" })], [], writers)).rejects.toThrow(
      "owner does not match"
    );
  });
});
