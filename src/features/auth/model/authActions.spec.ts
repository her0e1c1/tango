import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, linkWithPopup, signInWithCredential } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null as object | null },
  publishAuthenticatedUser: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: mocks.auth }));
vi.mock("@/features/auth/model/authController", () => ({
  publishAuthenticatedUser: mocks.publishAuthenticatedUser,
}));
vi.mock("firebase/auth");

import { loginGoogle } from "@/features/auth/model/authActions";

describe("loginGoogle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.currentUser = {};
  });

  it("publishes the linked user", async () => {
    const user = { uid: "uid-a" };
    vi.mocked(linkWithPopup).mockResolvedValue({ user } as never);

    await loginGoogle();

    expect(mocks.publishAuthenticatedUser).toHaveBeenCalledWith(user);
  });

  it("recovers a credential from a Firebase linking error", async () => {
    const error = new FirebaseError("auth/credential-already-in-use", "already linked");
    const credential = { providerId: "google.com", signInMethod: "google.com" };
    const user = { uid: "uid-a" };
    vi.mocked(linkWithPopup).mockRejectedValue(error);
    vi.mocked(GoogleAuthProvider.credentialFromError).mockReturnValue(credential as never);
    vi.mocked(signInWithCredential).mockResolvedValue({ user } as never);

    await loginGoogle();

    expect(signInWithCredential).toHaveBeenCalledWith(mocks.auth, credential);
    expect(mocks.publishAuthenticatedUser).toHaveBeenCalledWith(user);
  });

  it("fails when login does not return a user credential", async () => {
    vi.mocked(linkWithPopup).mockRejectedValue(new Error("popup closed"));

    await expect(loginGoogle()).rejects.toThrow("failed to login");
  });
});
