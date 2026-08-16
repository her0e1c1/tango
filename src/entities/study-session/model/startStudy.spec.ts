import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createPreferences } from "@/test/factories";
import { clearStudySessions, getStudySession, startStudy } from "./store";

describe("startStudy", () => {
  beforeEach(() => {
    clearStudySessions();
    localStorage.clear();
  });

  it("starts at index zero with the configured card order", () => {
    const cards = [
      createCard({ id: "first", numberOfSeen: 3 }),
      createCard({ id: "second", numberOfSeen: 2 }),
      createCard({ id: "third", numberOfSeen: 1 }),
    ];
    const { study } = createPreferences({ shuffled: false, maxNumberOfCardsToLearn: 2 });

    startStudy("deck", cards, study);

    expect(getStudySession("deck")?.currentIndex).toBe(0);
    expect(getStudySession("deck")?.cardOrderIds).toEqual(["third", "second"]);
  });

  it("copies the card order into the session", () => {
    const cards = [createCard({ id: "first" }), createCard({ id: "second" })];
    const { study } = createPreferences({ shuffled: false, maxNumberOfCardsToLearn: 2 });

    startStudy("deck", cards, study);
    cards.reverse();

    expect(getStudySession("deck")?.cardOrderIds).toEqual(["first", "second"]);
  });
});
