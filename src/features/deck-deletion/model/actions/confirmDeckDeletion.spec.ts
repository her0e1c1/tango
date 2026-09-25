import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteDeck, mustFindDeckById } from "@/entities/deck";
import { abandonStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { createDeck } from "@/test/factories";
import { confirmDeckDeletion } from "./confirmDeckDeletion";

const auth = vi.hoisted(() => ({ uid: "owner" }));
vi.mock("@/entities/auth", () => ({ getAuthUid: () => auth.uid }));
vi.mock("@/entities/deck", () => ({ deleteDeck: vi.fn(), getDecks: vi.fn(), mustFindDeckById: vi.fn() }));
vi.mock("@/entities/study-session", () => ({ abandonStudySession: vi.fn() }));
vi.mock("@/shared/ui/toast", () => ({ showToast: vi.fn() }));

describe("Deck deletion account guards [DECK-MANAGEMENT-02 DECK-MANAGEMENT-04]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.uid = "owner";
  });

  it.each(["deck success", "deck failure", "session success", "session failure"])(
    "ignores %s after an account switch and releases the pending interaction",
    async (outcome) => {
      const deck = createDeck({ id: "deck", uid: "owner" });
      vi.mocked(mustFindDeckById).mockReturnValue(deck);
      const pending = Promise.withResolvers<void>();
      if (outcome.startsWith("deck")) vi.mocked(deleteDeck).mockReturnValue(pending.promise);
      else vi.mocked(abandonStudySession).mockReturnValue(pending.promise);
      const setTarget = vi.fn();
      const setPending = vi.fn();
      const onDeleted = vi.fn();
      const result = confirmDeckDeletion({
        target: { deck, cardCount: 0 },
        pending: false,
        setTarget,
        setPending,
        onDeleted,
        isMounted: () => true,
      });
      await Promise.resolve();
      auth.uid = "next-user";
      if (outcome.endsWith("failure")) pending.reject(new Error("denied"));
      else pending.resolve();
      await result;
      expect(showToast).not.toHaveBeenCalled();
      expect(onDeleted).not.toHaveBeenCalled();
      expect(setTarget).not.toHaveBeenCalled();
      expect(setPending).toHaveBeenLastCalledWith(false);
      expect(abandonStudySession).toHaveBeenCalledTimes(outcome.startsWith("deck") ? 0 : 1);
    }
  );
});
