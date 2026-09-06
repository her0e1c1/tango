import { beforeEach, describe, expect, it, vi } from "vitest";

import { signOut } from "./signOut";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn<() => Promise<void>>(),
}));

vi.mock("../../api/signOutCurrentUser", () => ({ signOutCurrentUser: mocks.signOutCurrentUser }));

describe("ACCOUNT-03 signOut", () => {
  beforeEach(() => {
    mocks.signOutCurrentUser.mockReset();
    mocks.signOutCurrentUser.mockResolvedValue(undefined);
  });

  it("delegates execution to signOutCurrentUser", async () => {
    await signOut();

    expect(mocks.signOutCurrentUser).toHaveBeenCalledTimes(1);
  });
});
