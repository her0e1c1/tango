import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/firebase", () => ({ db: {} }));

import { editStudyProgress } from "./firestore";

describe("StudyProgress Firestore persistence", () => {
  it("rejects edit requests without a confirmed user identity", async () => {
    await expect(editStudyProgress("", { cardId: "card-a", score: 1 })).rejects.toThrow("confirmed user");
  });

  it("rejects edit requests without a card ID", async () => {
    await expect(editStudyProgress("uid-a", { cardId: "", score: 1 })).rejects.toThrow("Card id");
  });
});
