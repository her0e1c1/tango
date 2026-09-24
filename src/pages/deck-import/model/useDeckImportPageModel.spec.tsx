import { actAsync } from "@/test/act";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeck } from "@/entities/deck";
import { mutateCards } from "@/entities/card";
import { deckStore } from "@/entities/deck/model/store";
import { cardStore } from "@/entities/card/model/store";
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
vi.mock("@/entities/deck", async (original) => ({
  ...(await original<typeof import("@/entities/deck")>()),
  createDeck: vi.fn(),
}));
vi.mock("@/entities/card", async (original) => ({
  ...(await original<typeof import("@/entities/card")>()),
  mutateCards: vi.fn(),
}));

const csv = (name = "deck.csv") => new File(["front,back,tag,key"], name, { type: "text/csv" });

describe("Deck import operations [DECK-IMPORT-01 DECK-IMPORT-02 DECK-IMPORT-03 DECK-IMPORT-04 DECK-IMPORT-05 DECK-IMPORT-06]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deckStore.setState({ remoteDecks: [] });
    cardStore.setState({ remoteCards: [] });
    vi.mocked(createDeck)
      .mockReset()
      .mockImplementation(async (uid, input) => {
        deckStore.setState({ remoteDecks: [createDeckFixture({ id: input.id, name: input.name, uid })] });
      });
    vi.mocked(mutateCards)
      .mockReset()
      .mockImplementation(async (uid, mutations) => {
        cardStore.setState({
          remoteCards: mutations.flatMap((mutation) =>
            mutation.kind === "create"
              ? [
                  createCardFixture({
                    id: mutation.card.id,
                    deckId: mutation.card.deckId,
                    uid,
                    frontText: mutation.card.frontText,
                    backText: mutation.card.backText,
                    tags: mutation.card.tags,
                    uniqueKey: mutation.card.uniqueKey,
                  }),
                ]
              : []
          ),
        });
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
      expect(mutateCards).toHaveBeenCalledWith(uid, [
        expect.objectContaining({ kind: "create", card: expect.objectContaining({ frontText: "front" }) }),
      ]);
    }
  );

  it("does not save invalid CSV rows", async () => {
    await selectDeckImportFile(new File(["front,back"], "invalid.csv"));
    expect(await importDeckPreview()).toBe(false);
    expect(createDeck).not.toHaveBeenCalled();
  });

  it("reuses selected identities when a local save fails", async () => {
    await selectDeckImportFile(csv());
    vi.mocked(mutateCards).mockRejectedValueOnce(new Error("local save failed"));
    expect(await importDeckPreview()).toBe(false);
    const firstDeck = vi.mocked(createDeck).mock.calls[0];
    const firstCards = vi.mocked(mutateCards).mock.calls[0];
    expect(await importDeckPreview()).toBe(true);
    expect(vi.mocked(createDeck).mock.calls[1]).toEqual(firstDeck);
    expect(vi.mocked(mutateCards).mock.calls[1]).toEqual(firstCards);
  });

  it("does not import a selection prepared by another account", async () => {
    await selectDeckImportFile(csv());
    controls.uid = "another-uid";
    expect(await importDeckPreview()).toBe(false);
    expect(createDeck).not.toHaveBeenCalled();
  });

  it("keeps a pending import locked across unmount and reentry", async () => {
    let finish: () => void = () => undefined;
    vi.mocked(mutateCards).mockImplementationOnce(
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
    await waitFor(() => expect(mutateCards).toHaveBeenCalledOnce());
    view.unmount();
    const { result } = renderHook(useDeckImportPageModel);
    expect(result.current.view.pending).toBe(true);
    await actAsync(async () => {
      await Promise.resolve(result.current.importPreview());
    });
    expect(mutateCards).toHaveBeenCalledOnce();
    await actAsync(async () => finish());
    expect(controls.navigate).not.toHaveBeenCalled();
    expect(result.current.view.pending).toBe(false);
  });

  it("previews the built-in CSV example without writing it", async () => {
    await selectDeckImportExample("basic");
    expect(deckImportStore.getState().source.kind).toBe("selected");
    expect(createDeck).not.toHaveBeenCalled();
  });
});
