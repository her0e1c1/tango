import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import { createCard } from "@/test/factories";
import { getCardListControls } from "../queries/getCardListControls";
import { cardListStore } from "../store";
import { cancelBulkDifficulty } from "./cancelBulkDifficulty";
import { changeBulkDifficulty } from "./changeBulkDifficulty";
import { confirmBulkDifficulty } from "./confirmBulkDifficulty";
import { requestBulkDifficulty } from "./requestBulkDifficulty";

const mocks = vi.hoisted(() => ({
  editStudyProgress: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ getAuthUid: () => "user-id" }));
vi.mock("@/entities/study-progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/study-progress")>()),
  editStudyProgress: mocks.editStudyProgress,
}));
vi.mock("@/shared/ui/toast", () => ({ showToast: mocks.showToast }));

const firstCard = createCard({ id: "first-card", difficulty: 3 });
const secondCard = createCard({ id: "second-card", difficulty: 4 });
const cards = [firstCard, secondCard];
const nextCard = createCard({ id: "next-card", difficulty: 5 });

const readControls = () =>
  getCardListControls(cardListStore.getState(), {
    difficultyMin: MIN_DIFFICULTY,
    difficultyMax: MAX_DIFFICULTY,
    selectedTags: [],
    saving: false,
  });

describe("CARD-LIST-ACTIONS-05 CARD-LIST-ACTIONS-06 bulk difficulty workflow", () => {
  beforeEach(() => {
    cardListStore.setState(cardListStore.getInitialState(), true);
    vi.resetAllMocks();
    mocks.editStudyProgress.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cardListStore.setState(cardListStore.getInitialState(), true);
  });

  it.each(["cancel", "success"] as const)("starts a fresh selection after %s", async (outcome) => {
    requestBulkDifficulty(cards);
    changeBulkDifficulty(7);
    if (outcome === "cancel") cancelBulkDifficulty();
    else await confirmBulkDifficulty();
    expect(readControls().dialogOpen).toBe(false);
    mocks.editStudyProgress.mockClear();

    requestBulkDifficulty([nextCard]);
    await confirmBulkDifficulty();
    expect(readControls().dialogOpen).toBe(true);
    expect(mocks.editStudyProgress).not.toHaveBeenCalled();

    changeBulkDifficulty(8);
    await confirmBulkDifficulty();

    expect(mocks.editStudyProgress).toHaveBeenCalledExactlyOnceWith("user-id", {
      cardId: nextCard.id,
      difficulty: 8,
    });
    expect(mocks.showToast).toHaveBeenLastCalledWith({
      messageKey: "cardList.bulkDifficulty.success",
      messageParams: { count: 1, difficulty: 8 },
      tone: "success",
    });
    expect(readControls().dialogOpen).toBe(false);
  });

  it("retains the approved targets and value until a partial failure is retried", async () => {
    const remainingWrite = Promise.withResolvers<void>();
    mocks.editStudyProgress.mockRejectedValueOnce(new Error("first write failed"));
    mocks.editStudyProgress.mockReturnValueOnce(remainingWrite.promise);
    requestBulkDifficulty(cards);
    changeBulkDifficulty(7);
    const write = confirmBulkDifficulty();

    cancelBulkDifficulty();
    requestBulkDifficulty([nextCard]);
    changeBulkDifficulty(8);
    await confirmBulkDifficulty();
    expect(readControls().dialogOpen).toBe(true);
    expect(readControls().mutationPending).toBe(true);
    expect(mocks.editStudyProgress.mock.calls).toEqual([
      ["user-id", { cardId: firstCard.id, difficulty: 7 }],
      ["user-id", { cardId: secondCard.id, difficulty: 7 }],
    ]);

    remainingWrite.resolve();
    await write;
    expect(readControls().dialogOpen).toBe(true);
    expect(readControls().mutationPending).toBe(false);
    expect(mocks.showToast).toHaveBeenLastCalledWith({
      messageKey: "cardList.bulkDifficulty.partialFailure",
      messageParams: { count: 1, successCount: 1, totalCount: 2 },
      tone: "error",
    });
    mocks.editStudyProgress.mockClear();

    changeBulkDifficulty(8);
    await confirmBulkDifficulty();

    expect(mocks.editStudyProgress.mock.calls).toEqual([
      ["user-id", { cardId: firstCard.id, difficulty: 7 }],
      ["user-id", { cardId: secondCard.id, difficulty: 7 }],
    ]);
    expect(mocks.showToast).toHaveBeenLastCalledWith({
      messageKey: "cardList.bulkDifficulty.success",
      messageParams: { count: 2, difficulty: 7 },
      tone: "success",
    });
    expect(readControls().dialogOpen).toBe(false);
  });
});
