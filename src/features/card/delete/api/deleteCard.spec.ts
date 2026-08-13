import { describe, expect, it } from "vitest";

import { deleteCard } from "./deleteCard";

describe("deleteCard", () => {
  it("rejects a missing user", async () => {
    await expect(deleteCard("", "card")).rejects.toThrow("confirmed user");
  });
});
