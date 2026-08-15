import { describe, expect, it, vi } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  doc: vi.fn((...parts: unknown[]) => parts),
  getDocFromServer: vi.fn(),
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return { ...actual, doc: mocks.doc, getDocFromServer: mocks.getDocFromServer };
});
vi.mock("@/shared/firebase", () => ({ db: {} }));

import { createCard, deleteCard, editCard, fetchCardFromServer } from "./firestore";

describe("Card Firestore persistence", () => {
  const card = createCardFixture({ id: "card", uid: "uid-a" });

  it("reads only the requested Card from the server", async () => {
    mocks.getDocFromServer.mockResolvedValueOnce({ exists: () => true, id: card.id, data: () => card });

    await expect(fetchCardFromServer(card.id)).resolves.toEqual(card);
    expect(mocks.doc).toHaveBeenCalledWith({}, "card", card.id);
  });

  it("returns undefined when the server Card is missing", async () => {
    mocks.getDocFromServer.mockResolvedValueOnce({ exists: () => false });

    await expect(fetchCardFromServer(card.id)).resolves.toBeUndefined();
  });

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
