import { describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ db: {} }));

import { editCard } from "./editCard";

const card = createCardFixture({ id: "card", uid: "uid-a" });

describe("editCard", () => {
  it("rejects missing users and mismatched owners", async () => {
    await expect(editCard("", card)).rejects.toThrow("confirmed user");
    await expect(editCard("uid-b", card)).rejects.toThrow("owner does not match");
  });
});
