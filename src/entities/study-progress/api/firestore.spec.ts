import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ db: {} }));

import { editRemoteStudyProgress } from "./firestore";

describe("StudyProgress Firestore persistence", () => {
  it("rejects edit requests without a confirmed user identity", async () => {
    await expect(editRemoteStudyProgress("", { cardId: "card-a", score: 1 })).rejects.toThrow("confirmed user");
  });

  it("rejects edit requests without a card ID", async () => {
    await expect(editRemoteStudyProgress("uid-a", { cardId: "", score: 1 })).rejects.toThrow("Card id");
  });
});
