import { actAsync } from "@/test/act";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeck, getDecks } from "@/entities/deck";
import { createCard, getCards } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";
import { replaceRemoteDecks, replaceRemoteCards } from "@/test/utils/entityFixtures";
import { createDeck as createDeckFixture, createCard as createCardFixture } from "@/test/factories";
import { useDeckImportPageModel } from "./useDeckImportPageModel";
import { deckImportStore } from "./store";
import { selectDeckImportFile } from "./actions/selectDeckImportFile";
import { importDeckPreview } from "./actions/importDeckPreview";
import { selectDeckImportExample } from "./actions/selectDeckImportExample";

const controls = vi.hoisted(() => ({ uid: "anonymous-uid", navigate: vi.fn() }));
vi.mock("@/shared/firebase", () => ({ db: {}, auth: {} }));
vi.mock("@/entities/auth", () => ({ getAuthUid: () => controls.uid }));
vi.mock("react-router-dom", () => ({ useNavigate: () => controls.navigate }));
vi.mock("@/shared/ui/toast", () => ({ showToast: vi.fn() }));
vi.mock("@/entities/deck", async (original) => ({
  ...(await original<typeof import("@/entities/deck")>()),
  createDeck: vi.fn(),
}));
vi.mock("@/entities/card", async (original) => ({
  ...(await original<typeof import("@/entities/card")>()),
  createCard: vi.fn(),
}));

const csv = (name = "deck.csv") => new File(["front,back,tag,key"], name, { type: "text/csv" });

describe("Deck import operations [DECK-IMPORT-01 DECK-IMPORT-02 DECK-IMPORT-03 DECK-IMPORT-04 DECK-IMPORT-05 DECK-IMPORT-06]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceRemoteDecks([]);
    replaceRemoteCards([]);
    vi.mocked(createDeck)
      .mockReset()
      .mockImplementation(async (uid, input) => {
        await Promise.resolve();
        replaceRemoteDecks([
          ...getDecks().filter((deck) => deck.id !== input.id),
          createDeckFixture({ id: input.id, name: input.name, uid }),
        ]);
      });
    vi.mocked(createCard)
      .mockReset()
      .mockImplementation(async (uid, card) => {
        await Promise.resolve();
        replaceRemoteCards([
          ...getCards().filter((item) => item.id !== card.id),
          createCardFixture({
            id: card.id,
            deckId: card.deckId,
            uid,
            frontText: card.frontText,
            backText: card.backText,
            tags: card.tags,
            uniqueKey: card.uniqueKey,
          }),
        ]);
      });
    deckImportStore.setState(deckImportStore.getInitialState(), true);
    controls.uid = "anonymous-uid";
  });

  it.each(["anonymous-uid", "linked-uid"])(
    "previews and imports using the same persistence boundary for %s",
    async (uid) => {
      controls.uid = uid;
      const { result } = renderHook(useDeckImportPageModel);
      await actAsync(async () => {
        await selectDeckImportFile(csv());
      });
      expect(result.current.view.preview?.analysis.rows).toHaveLength(1);
      expect(createDeck).not.toHaveBeenCalled();
      await actAsync(async () => {
        await Promise.resolve(result.current.importPreview());
      });
      await waitFor(() => expect(controls.navigate).toHaveBeenCalled());
      expect(createDeck).toHaveBeenCalledWith(uid, expect.objectContaining({ name: "deck.csv" }));
      expect(createCard).toHaveBeenCalledWith(uid, expect.objectContaining({ frontText: "front" }));
    }
  );

  it("saves same-name selections as distinct Decks after their snapshots arrive", async () => {
    const { result } = renderHook(useDeckImportPageModel);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await actAsync(async () => selectDeckImportFile(csv("same.csv")));
      await actAsync(async () => result.current.importPreview());
      await waitFor(() => expect(result.current.view.preview).toBeUndefined());
    }

    const decks = getDecks();
    const cards = getCards();
    expect(decks).toHaveLength(2);
    expect(new Set(decks.map((deck) => deck.id)).size).toBe(2);
    expect(decks.every((deck) => deck.name === "same.csv")).toBe(true);
    expect(cards).toHaveLength(2);
    expect(new Set(cards.map((card) => card.id)).size).toBe(2);
    for (const deck of decks) {
      expect(cards.filter((card) => card.deckId === deck.id)).toEqual([
        expect.objectContaining({ frontText: "front", backText: "back" }),
      ]);
    }
  });

  it.each(["deck first", "cards first"])(
    "waits for the destination and every created Card before completing once (%s)",
    async (arrivalOrder) => {
      vi.mocked(createDeck).mockResolvedValue(undefined);
      vi.mocked(createCard).mockResolvedValue(undefined);
      const { result, rerender } = renderHook(useDeckImportPageModel);
      await actAsync(() => selectDeckImportFile(new File(["front,back,tag,key\nsecond,answer,tag,other"], "deck.csv")));
      await actAsync(async () => result.current.importPreview());
      const destination = vi.mocked(createDeck).mock.calls[0]![1];
      const deck = createDeckFixture({ id: destination.id, name: destination.name, uid: controls.uid });
      const cards = vi.mocked(createCard).mock.calls.map(([uid, card]) => createCardFixture({ ...card, uid }));
      expect(cards).toHaveLength(2);

      act(() => {
        if (arrivalOrder === "deck first") {
          replaceRemoteDecks([deck]);
          replaceRemoteCards(cards.slice(0, 1));
        } else {
          replaceRemoteCards(cards);
        }
      });
      expect(result.current.view.pending).toBe(true);
      expect(result.current.view.preview?.analysis.rows).toHaveLength(2);
      expect(showToast).not.toHaveBeenCalled();
      expect(controls.navigate).not.toHaveBeenCalled();

      act(() => {
        replaceRemoteDecks([deck]);
        replaceRemoteCards(cards);
      });
      expect(result.current.view.pending).toBe(false);
      expect(result.current.view.preview).toBeUndefined();
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        messageKey: "deckImport.toast.imported",
        messageParams: { count: 2 },
        tone: "success",
      });
      expect(controls.navigate).toHaveBeenCalledExactlyOnceWith("/");

      act(() => {
        replaceRemoteDecks([deck]);
        replaceRemoteCards(cards);
      });
      rerender();
      expect(showToast).toHaveBeenCalledOnce();
      expect(controls.navigate).toHaveBeenCalledOnce();
    }
  );

  it("does not save invalid CSV rows", async () => {
    await selectDeckImportFile(new File(["front,back"], "invalid.csv"));
    expect(await importDeckPreview()).toBe(false);
    expect(createDeck).not.toHaveBeenCalled();
  });

  it("reuses selected identities when a local save fails", async () => {
    await selectDeckImportFile(csv());
    vi.mocked(createCard).mockRejectedValueOnce(new Error("local save failed"));
    expect(await importDeckPreview()).toBe(false);
    const firstDeck = vi.mocked(createDeck).mock.calls[0]?.slice(0, 2);
    const firstCards = vi.mocked(createCard).mock.calls[0]?.slice(0, 2);
    expect(await importDeckPreview()).toBe(true);
    expect(vi.mocked(createDeck).mock.calls[1]?.slice(0, 2)).toEqual(firstDeck);
    expect(vi.mocked(createCard).mock.calls[1]?.slice(0, 2)).toEqual(firstCards);
  });

  it("does not import a selection prepared by another account", async () => {
    await selectDeckImportFile(csv());
    controls.uid = "another-uid";
    expect(await importDeckPreview()).toBe(false);
    expect(createDeck).not.toHaveBeenCalled();
  });

  it("keeps a pending import locked across unmount and reentry", async () => {
    let finish: () => void = () => undefined;
    vi.mocked(createCard).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const view = renderHook(useDeckImportPageModel);
    await actAsync(async () => {
      await selectDeckImportFile(csv());
    });
    act(() => view.result.current.importPreview());
    await waitFor(() => expect(createCard).toHaveBeenCalledOnce());
    view.unmount();
    const { result } = renderHook(useDeckImportPageModel);
    expect(result.current.view.pending).toBe(true);
    await actAsync(async () => {
      await Promise.resolve(result.current.importPreview());
    });
    expect(createCard).toHaveBeenCalledOnce();
    await actAsync(async () => finish());
    expect(result.current.view.pending).toBe(true);
    act(() => {
      const card = vi.mocked(createCard).mock.calls[0]?.[1];
      if (card) {
        replaceRemoteCards([createCardFixture({ ...card, deletedAt: null, uid: controls.uid })]);
      }
    });
    expect(controls.navigate).not.toHaveBeenCalled();
    expect(result.current.view.pending).toBe(false);
    expect(result.current.view.preview).toBeUndefined();
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      messageKey: "deckImport.toast.imported",
      messageParams: { count: 1 },
      tone: "success",
    });
  });

  it("previews the built-in CSV example without writing it", async () => {
    await selectDeckImportExample("basic");
    expect(deckImportStore.getState().source.kind).toBe("selected");
    expect(createDeck).not.toHaveBeenCalled();
  });
});
