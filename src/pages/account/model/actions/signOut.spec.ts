import { signOut as firebaseSignOut } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: {} }));

vi.mock("@/shared/firebase", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth");

import { signOut } from "./signOut";

describe("ACCOUNT-03 signOut", () => {
  beforeEach(() => {
    vi.mocked(firebaseSignOut).mockReset();
    vi.mocked(firebaseSignOut).mockResolvedValue(undefined);
  });

  it("signs out through Firebase Auth", async () => {
    await expect(signOut()).resolves.toBeUndefined();
    expect(firebaseSignOut).toHaveBeenCalledWith(mocks.auth);
  });

  it("propagates Firebase sign-out failures", async () => {
    const error = new Error("Sign-out failed");
    vi.mocked(firebaseSignOut).mockRejectedValue(error);
    await expect(signOut()).rejects.toBe(error);
  });
});
