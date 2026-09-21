import { signOut } from "firebase/auth";
import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: {} }));

vi.mock("@/shared/firebase", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth");

import { signOutCurrentUser } from "./signOutCurrentUser";

it("ACCOUNT-03 signs out through Firebase Auth", async () => {
  await signOutCurrentUser();

  expect(signOut).toHaveBeenCalledWith(mocks.auth);
});
