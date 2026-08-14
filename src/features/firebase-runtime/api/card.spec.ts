import { describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

vi.mock("@/shared/firebase", async () => ({
  ...(await import("@/test/firebaseHelpers")).firebaseHelpers,
  db: {},
}));

import { createCard, deleteCard, editCard } from "./card";

describe("Card Firestore persistence", () => {
  const card = createCardFixture({ id: "card", uid: "uid-a" });

  it("rejects create requests without a confirmed matching owner", async () => {
    await expect(createCard("", card)).rejects.toThrow("confirmed user");
    await expect(createCard("uid-b", card)).rejects.toThrow("owner does not match");
  });

  it("rejects edit requests without a confirmed matching owner", async () => {
    await expect(editCard("", card)).rejects.toThrow("confirmed user");
    await expect(editCard("uid-b", card)).rejects.toThrow("owner does not match");
  });

  it("rejects delete requests without a confirmed matching owner", async () => {
    await expect(deleteCard("", card)).rejects.toThrow("confirmed user");
    await expect(deleteCard("uid-b", card)).rejects.toThrow("owner does not match");
  });
});
