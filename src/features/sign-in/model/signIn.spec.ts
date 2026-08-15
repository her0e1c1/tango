import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, linkWithPopup, signInWithCredential } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null as { isAnonymous: boolean } | null },
}));

vi.mock("@/shared/api", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth");

import { loginGoogle } from "./signIn";

describe("loginGoogle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.currentUser = { isAnonymous: true };
  });

  it("returns the linked user", async () => {
    const user = { uid: "uid-a" };
    vi.mocked(linkWithPopup).mockResolvedValue({ user } as never);

    await expect(loginGoogle()).resolves.toBe(user);
  });

  it("recovers a credential from a Firebase linking error", async () => {
    const error = new FirebaseError("auth/credential-already-in-use", "already linked");
    const credential = { providerId: "google.com", signInMethod: "google.com" };
    const user = { uid: "uid-a" };
    vi.mocked(linkWithPopup).mockRejectedValue(error);
    vi.mocked(GoogleAuthProvider.credentialFromError).mockReturnValue(credential as never);
    vi.mocked(signInWithCredential).mockResolvedValue({ user } as never);

    await expect(loginGoogle()).resolves.toBe(user);

    expect(signInWithCredential).toHaveBeenCalledWith(mocks.auth, credential);
  });

  it("rejects login without an anonymous user", async () => {
    mocks.auth.currentUser = null;

    await expect(loginGoogle()).rejects.toThrow("Anonymous user is required before Google sign-in");
    expect(linkWithPopup).not.toHaveBeenCalled();
  });

  it("rejects login for a non-anonymous user", async () => {
    mocks.auth.currentUser = { isAnonymous: false };

    await expect(loginGoogle()).rejects.toThrow("Anonymous user is required before Google sign-in");
    expect(linkWithPopup).not.toHaveBeenCalled();
  });

  it("preserves non-Firebase linking errors", async () => {
    const error = new Error("popup failed");
    vi.mocked(linkWithPopup).mockRejectedValue(error);

    await expect(loginGoogle()).rejects.toBe(error);
  });

  it("preserves Firebase linking errors without a credential", async () => {
    const error = new FirebaseError("auth/popup-closed-by-user", "Popup closed");
    vi.mocked(linkWithPopup).mockRejectedValue(error);
    vi.mocked(GoogleAuthProvider.credentialFromError).mockReturnValue(null);

    await expect(loginGoogle()).rejects.toBe(error);
  });

  it("propagates credential recovery failures", async () => {
    const linkingError = new FirebaseError("auth/credential-already-in-use", "already linked");
    const recoveryError = new Error("credential recovery failed");
    vi.mocked(linkWithPopup).mockRejectedValue(linkingError);
    vi.mocked(GoogleAuthProvider.credentialFromError).mockReturnValue({} as never);
    vi.mocked(signInWithCredential).mockRejectedValue(recoveryError);

    await expect(loginGoogle()).rejects.toBe(recoveryError);
  });
});
