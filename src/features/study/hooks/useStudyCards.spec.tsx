import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StudyProgress } from "@/entities/study-progress";
import { createCard, createStudyProgress } from "@/test/factories";

const mocks = vi.hoisted(() => ({ progresses: [] as StudyProgress[] }));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/study-progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/study-progress")>();
  return { ...actual, useStudyProgresses: () => mocks.progresses };
});

import { useStudyCardItems } from "./useStudyCards";

describe("useStudyCardItems", () => {
  beforeEach(() => {
    mocks.progresses = [];
  });

  it("joins Cards with their independently read StudyProgress", () => {
    const card = createCard({ id: "card" });
    const progress = createStudyProgress({ cardId: card.id, score: 3, numberOfSeen: 4 });
    mocks.progresses = [progress];

    expect(renderHook(() => useStudyCardItems([card])).result.current).toEqual([{ card, progress }]);
  });

  it("omits a Card until its StudyProgress is available", () => {
    const card = createCard({ id: "local-card" });

    expect(renderHook(() => useStudyCardItems([card])).result.current).toEqual([]);
  });
});
