import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { replaceAuthSession } from "@/entities/auth";
import { editCard } from "@/entities/card";
import { applyCardChanges, clearRemoteCards } from "@/entities/card/model/store";
import { setRemoteDecks } from "@/entities/deck/model/store";
import { submit } from "@/pages/card-edit/model/actions/submit";
import { showToast } from "@/shared/ui/toast";
import { createCard, createDeck } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/shared/ui/toast", () => ({ showToast: vi.fn() }));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  editCard: vi.fn(),
}));

const owner = { status: "authenticated" as const, uid: "owner", isAnonymous: false, displayName: null };
const deck = createDeck({ uid: owner.uid });
const card = createCard({ uid: owner.uid });
const values = { frontText: "Saved content", backText: "Saved back", tags: ["custom"] };

async function flushCompletions() {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe("CARD-MANAGEMENT-20 CARD-MANAGEMENT-26 CARD-MANAGEMENT-27 Card edit notification lifetime", () => {
  beforeEach(() => {
    // Given: A signed-in owner has one existing Card; only persistence I/O and notification delivery are mocked.
    vi.mocked(editCard).mockReset().mockResolvedValue(undefined);
    vi.mocked(showToast).mockClear();
    replaceAuthSession(owner);
    setRemoteDecks([deck]);
    clearRemoteCards();
    applyCardChanges([card]);
  });

  afterEach(() => {
    setRemoteDecks([]);
    replaceAuthSession({ status: "unauthenticated" });
    clearRemoteCards();
  });

  it.each([
    { phase: "write", restoreFirst: false },
    { phase: "write", restoreFirst: true },
    { phase: "content", restoreFirst: false },
    { phase: "content", restoreFirst: true },
  ])(
    "CARD-MANAGEMENT-26 notifies after sign-out is refused ($phase, restore first: $restoreFirst)",
    async ({ phase, restoreFirst }) => {
      // Given: Saving has started, possibly already waiting for the existing read model.
      const write = Promise.withResolvers<void>();
      vi.mocked(editCard).mockReturnValueOnce(write.promise);
      const saved = submit({ cardId: card.id, values });
      if (phase === "content") {
        write.resolve();
        await flushCompletions();
      }

      // When: The auth check and successful save finish in either order without changing the owner.
      replaceAuthSession({ status: "initializing" });
      if (restoreFirst) replaceAuthSession(owner);
      write.resolve();
      applyCardChanges([{ ...card, ...values }]);
      await flushCompletions();

      // Then: An unfinished auth check cannot publish the result.
      expect(showToast).toHaveBeenCalledTimes(restoreFirst ? 1 : 0);

      // When: Sign-out is refused and the original owner resumes using the application.
      replaceAuthSession(owner);
      await expect(saved).resolves.toBe(true);

      // Then: The saved Card produces one result, independent of the completion order.
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        messageKey: "cardForm.toast.updated",
        messageParams: { name: values.frontText },
        tone: "success",
      });
      replaceAuthSession(owner);
      applyCardChanges([{ ...card, ...values }]);
      expect(showToast).toHaveBeenCalledTimes(1);
    }
  );

  it.each(["write", "content", "auth"])(
    "CARD-MANAGEMENT-27 stops a removed Deck's notification while waiting for %s",
    async (phase) => {
      // Given: A Card save is waiting for persistence, its content, or the same-owner auth decision.
      const write = Promise.withResolvers<void>();
      vi.mocked(editCard).mockReturnValueOnce(write.promise);
      const saved = submit({ cardId: card.id, values });
      if (phase !== "write") {
        write.resolve();
        await flushCompletions();
      }
      if (phase === "auth") {
        replaceAuthSession({ status: "initializing" });
        applyCardChanges([{ ...card, ...values }]);
        await flushCompletions();
      }

      // When: The owning Deck disappears without a subsequent Card snapshot.
      setRemoteDecks([]);

      // Then: The notification operation ends without waiting for the outstanding write or Card event.
      await expect(saved).resolves.toBe(false);
      expect(showToast).not.toHaveBeenCalled();

      // When: Late persistence and store events arrive, even after the Deck is available again.
      setRemoteDecks([deck]);
      replaceAuthSession(owner);
      applyCardChanges([{ ...card, ...values }]);
      write.resolve();
      await flushCompletions();

      // Then: The discarded operation cannot resume or announce a stale result.
      expect(showToast).not.toHaveBeenCalled();
    }
  );

  it.each(["write", "content", "auth"])(
    "CARD-MANAGEMENT-20 ends an old owner's operation while waiting for %s",
    async (phase) => {
      // Given: The original owner's save has not yet produced a notification.
      const write = Promise.withResolvers<void>();
      vi.mocked(editCard).mockReturnValueOnce(write.promise);
      const saved = submit({ cardId: card.id, values });
      if (phase !== "write") {
        write.resolve();
        await flushCompletions();
      }
      if (phase === "auth") {
        replaceAuthSession({ status: "initializing" });
        applyCardChanges([{ ...card, ...values }]);
        await flushCompletions();
      }

      // When: A different owner becomes active, then the first owner returns before the late write finishes.
      replaceAuthSession({ ...owner, uid: "another-owner" });
      replaceAuthSession(owner);

      // Then: Returning cannot revive an operation from an ended authentication session.
      await expect(saved).resolves.toBe(false);
      write.resolve();
      applyCardChanges([{ ...card, ...values }]);
      await flushCompletions();
      expect(showToast).not.toHaveBeenCalled();
    }
  );

  it("CARD-MANAGEMENT-27 retains a save hidden by the browsing filter", async () => {
    // Given: The Card's saved content has not yet appeared in the existing read model.
    const saved = submit({ cardId: card.id, values });
    await flushCompletions();

    // When: Browsing filters hide the Card while the underlying Deck remains available.
    setRemoteDecks([{ ...deck, cardFilter: { selectedTags: ["another-tag"], tagAndFilter: false } }]);
    applyCardChanges([{ ...card, ...values }]);

    // Then: Filtering is not deletion and the successful edit is still announced.
    await expect(saved).resolves.toBe(true);
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it("CARD-MANAGEMENT-26 waits if another auth check starts before notification", async () => {
    // Given: Saved content is waiting for the original owner to resume.
    const saved = submit({ cardId: card.id, values });
    replaceAuthSession({ status: "initializing" });
    applyCardChanges([{ ...card, ...values }]);
    await flushCompletions();

    // When: One refused sign-out is immediately followed by another authentication check.
    replaceAuthSession(owner);
    replaceAuthSession({ status: "initializing" });
    await flushCompletions();

    // Then: The intermediate return does not publish into the new authentication check.
    expect(showToast).not.toHaveBeenCalled();

    // When: The second check also returns to the original owner.
    replaceAuthSession(owner);

    // Then: The original successful edit is still announced exactly once.
    await expect(saved).resolves.toBe(true);
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it("CARD-MANAGEMENT-26 discards a superseded result during an auth check", async () => {
    // Given: A completed old edit is waiting for the original owner to resume.
    const saved = submit({ cardId: card.id, values });
    replaceAuthSession({ status: "initializing" });
    applyCardChanges([{ ...card, ...values }]);
    await flushCompletions();

    // When: The owner returns and immediately submits a newer edit before the old continuation resumes.
    replaceAuthSession(owner);
    const newer = { ...values, frontText: "Newer content" };
    const newSave = submit({ cardId: card.id, values: newer });
    applyCardChanges([{ ...card, ...newer }]);

    // Then: Only the newest same-Card operation can publish its result.
    await expect(saved).resolves.toBe(false);
    await expect(newSave).resolves.toBe(true);
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      messageKey: "cardForm.toast.updated",
      messageParams: { name: newer.frontText },
      tone: "success",
    });
  });

  it("CARD-MANAGEMENT-20 keeps different Cards' pending notifications independent", async () => {
    // Given: Two existing Cards have independent edits pending.
    const anotherCard = createCard({ id: "another-card", uid: owner.uid });
    applyCardChanges([anotherCard]);
    const firstSave = submit({ cardId: card.id, values });
    const anotherValues = { ...values, frontText: "Another saved Card" };
    const secondSave = submit({ cardId: anotherCard.id, values: anotherValues });
    await flushCompletions();

    // When: Their saved contents arrive in reverse order.
    applyCardChanges([{ ...anotherCard, ...anotherValues }]);
    await expect(secondSave).resolves.toBe(true);
    applyCardChanges([{ ...card, ...values }]);
    await expect(firstSave).resolves.toBe(true);

    // Then: Each Card reports its own saved content once.
    expect(vi.mocked(showToast).mock.calls.map(([toast]) => toast.messageParams?.name)).toEqual([
      anotherValues.frontText,
      values.frontText,
    ]);
  });

  it("CARD-MANAGEMENT-27 suppresses a late write rejection after Deck deletion", async () => {
    // Given: The persistence request remains pending when its Deck is removed.
    const write = Promise.withResolvers<void>();
    vi.mocked(editCard).mockReturnValueOnce(write.promise);
    const saved = submit({ cardId: card.id, values });

    // When: The Deck is deleted and the old persistence request later rejects.
    setRemoteDecks([]);
    await expect(saved).resolves.toBe(false);
    write.reject(new Error("late write failure"));
    await flushCompletions();

    // Then: Neither a stale success nor a stale failure replaces the current notification.
    expect(showToast).not.toHaveBeenCalled();
  });
});
