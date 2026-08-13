import type { Card } from "@/entities/card";

import { describe, expect, it } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

import { cardCommands } from "./cardCommands";

const createCard = (overrides: Partial<Card> = {}) => createCardFixture({ uid: "uid-a", ...overrides });

describe("cardCommands", () => {
  it("rejects writes without a confirmed user", async () => {
    await expect(cardCommands.create("", createCard())).rejects.toThrow("confirmed user");
    await expect(cardCommands.update("", createCard())).rejects.toThrow("confirmed user");
    await expect(cardCommands.remove("", "card")).rejects.toThrow("confirmed user");
  });

  it("rejects writes owned by another user", async () => {
    await expect(cardCommands.create("uid-a", createCard({ uid: "uid-b" }))).rejects.toThrow("owner does not match");
    await expect(cardCommands.update("uid-a", createCard({ uid: "uid-b" }))).rejects.toThrow("owner does not match");
  });
});
