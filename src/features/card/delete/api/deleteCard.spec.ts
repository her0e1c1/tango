import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ db: {} }));

import { deleteCard } from "./deleteCard";

describe("deleteCard", () => {
  it("rejects missing users and mismatched owners", async () => {
    const card = { id: "card", uid: "uid-a" };
    await expect(deleteCard("", card)).rejects.toThrow("confirmed user");
    await expect(deleteCard("uid-b", card)).rejects.toThrow("owner does not match");
  });
});
