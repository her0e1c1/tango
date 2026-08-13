import { describe, expect, it } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

import { editCard } from "./editCard";

const card = createCardFixture({ id: "card", uid: "uid-a" });

describe("editCard", () => {
  it("rejects missing users and mismatched owners", async () => {
    await expect(editCard("", card)).rejects.toThrow("confirmed user");
    await expect(editCard("uid-b", card)).rejects.toThrow("owner does not match");
  });
});
