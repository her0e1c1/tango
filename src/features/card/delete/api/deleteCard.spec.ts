import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ removeCardDocument: vi.fn() }));
vi.mock("./firestore", () => ({ removeCardDocument: mocks.removeCardDocument }));

import { deleteCard } from "./deleteCard";

describe("deleteCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.removeCardDocument.mockResolvedValue(undefined);
  });

  it("rejects missing users and mismatched owners", async () => {
    const card = { id: "card", uid: "uid-a" };
    await expect(deleteCard("", card)).rejects.toThrow("confirmed user");
    await expect(deleteCard("uid-b", card)).rejects.toThrow("owner does not match");
  });

  it("deletes the validated Card identity", async () => {
    await deleteCard("uid-a", { id: "card", uid: "uid-a" });
    expect(mocks.removeCardDocument).toHaveBeenCalledWith("card");
  });
});
