import { signOut } from "firebase/auth";
import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: {} }));

vi.mock("@/shared/lib/firestoreRuntime", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth");

import { signOutCurrentUser } from "./signOut";

it("signs out through Firebase Auth", async () => {
  await signOutCurrentUser();

  expect(signOut).toHaveBeenCalledWith(mocks.auth);
});
