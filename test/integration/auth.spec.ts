import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, linkWithPopup, signInWithCredential, signOut } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null as { isAnonymous: boolean } | null },
}));

vi.mock("@/shared/firebase", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth");

import { signInWithGoogle, signOutCurrentUser } from "@/entities/auth";

describe("ACCOUNT-01 ACCOUNT-02 signInWithGoogle", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    vi.clearAllMocks();
    mocks.auth.currentUser = { isAnonymous: true };
  });

  it("returns the linked user", async () => {
    // Given: Prepare `user` and any shared test state below.
    const user = { uid: "uid-a" };
    vi.mocked(linkWithPopup).mockResolvedValue({ user } as never);

    // When: Evaluate `signInWithGoogle` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await expect(signInWithGoogle()).resolves.toBe(user);
  });

  it("recovers a credential from a Firebase linking error", async () => {
    // Given: Prepare `error`, `credential`, `user` and any shared test state below.
    const error = new FirebaseError("auth/credential-already-in-use", "already linked");
    const credential = { providerId: "google.com", signInMethod: "google.com" };
    const user = { uid: "uid-a" };
    vi.mocked(linkWithPopup).mockRejectedValue(error);
    vi.mocked(GoogleAuthProvider.credentialFromError).mockReturnValue(credential as never);
    vi.mocked(signInWithCredential).mockResolvedValue({ user } as never);

    // When: Evaluate `signInWithGoogle` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await expect(signInWithGoogle()).resolves.toBe(user);

    expect(signInWithCredential).toHaveBeenCalledWith(mocks.auth, credential);
  });

  it("rejects login without an anonymous user", async () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.auth.currentUser = null;

    // When: Evaluate `signInWithGoogle` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await expect(signInWithGoogle()).rejects.toThrow("Anonymous user is required before Google sign-in");
    expect(linkWithPopup).not.toHaveBeenCalled();
  });

  it("rejects login for a non-anonymous user", async () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.auth.currentUser = { isAnonymous: false };

    // When: Evaluate `signInWithGoogle` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await expect(signInWithGoogle()).rejects.toThrow("Anonymous user is required before Google sign-in");
    expect(linkWithPopup).not.toHaveBeenCalled();
  });

  it("preserves non-Firebase linking errors", async () => {
    // Given: Prepare `error` and any shared test state below.
    const error = new Error("popup failed");
    vi.mocked(linkWithPopup).mockRejectedValue(error);

    // When: Evaluate `signInWithGoogle` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await expect(signInWithGoogle()).rejects.toBe(error);
  });

  it("preserves Firebase linking errors without a credential", async () => {
    // Given: Prepare `error` and any shared test state below.
    const error = new FirebaseError("auth/popup-closed-by-user", "Popup closed");
    vi.mocked(linkWithPopup).mockRejectedValue(error);
    vi.mocked(GoogleAuthProvider.credentialFromError).mockReturnValue(null);

    // When: Evaluate `signInWithGoogle` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await expect(signInWithGoogle()).rejects.toBe(error);
  });

  it("propagates credential recovery failures", async () => {
    // Given: Prepare `linkingError`, `recoveryError` and any shared test state below.
    const linkingError = new FirebaseError("auth/credential-already-in-use", "already linked");
    const recoveryError = new Error("credential recovery failed");
    vi.mocked(linkWithPopup).mockRejectedValue(linkingError);
    vi.mocked(GoogleAuthProvider.credentialFromError).mockReturnValue({} as never);
    vi.mocked(signInWithCredential).mockRejectedValue(recoveryError);

    // When: Evaluate `signInWithGoogle` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await expect(signInWithGoogle()).rejects.toBe(recoveryError);
  });
});

it("ACCOUNT-03 signs out through Firebase Auth", async () => {
  // Given: Use this case's inputs and any shared test setup.
  // When: Exercise `signOutCurrentUser` with the prepared inputs.
  await signOutCurrentUser();

  // Then: Verify the expected result in the assertions below.
  expect(signOut).toHaveBeenCalledWith(mocks.auth);
});
