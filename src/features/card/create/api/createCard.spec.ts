import { describe, expect, it } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

import { createCard } from "../index";

const card = createCardFixture({ id: "card", uid: "uid-a" });

describe("createCard", () => {
  it("rejects missing users and mismatched owners", async () => {
    await expect(createCard("", card)).rejects.toThrow("confirmed user");
    await expect(createCard("uid-b", card)).rejects.toThrow("owner does not match");
  });
});
