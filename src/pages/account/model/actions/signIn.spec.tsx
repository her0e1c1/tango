import { beforeEach, describe, expect, it, vi } from "vitest";

import { signIn } from "./signIn";

const mocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("../../api/signInWithGoogle", () => ({ signInWithGoogle: mocks.signInWithGoogle }));

describe("ACCOUNT-02 signIn", () => {
  beforeEach(() => {
    mocks.signInWithGoogle.mockReset();
    mocks.signInWithGoogle.mockResolvedValue(undefined);
  });

  it("delegates execution to signInWithGoogle", async () => {
    await signIn();

    expect(mocks.signInWithGoogle).toHaveBeenCalledTimes(1);
  });
});
