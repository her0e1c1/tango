import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { actAsync } from "@/test/act";

import { accountPageStore } from "../store";
import { signOut } from "./signOut";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn<() => Promise<void>>(),
}));

vi.mock("@/entities/auth", () => ({ signOutCurrentUser: mocks.signOutCurrentUser }));

describe("ACCOUNT-03 signOut", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    dismissToast();
    accountPageStore.setState(accountPageStore.getInitialState(), true);
    mocks.signOutCurrentUser.mockReset();
    mocks.signOutCurrentUser.mockResolvedValue(undefined);
  });

  it("announces a successful sign-out", async () => {
    // Given: Use this case's inputs and any shared test setup.
    render(<ToastViewport />);

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await signOut();
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed out.");
  });

  it("replaces a handled failure with success when retried", async () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.signOutCurrentUser.mockRejectedValueOnce(new Error("Action failed"));
    render(<ToastViewport />);

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await signOut();
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to sign out.");

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await signOut();
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed out.");
  });
});
