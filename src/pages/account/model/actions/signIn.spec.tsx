import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { actAsync } from "@/test/act";

import { accountPageStore } from "../store";
import { signIn } from "./signIn";

const mocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("@/entities/auth", () => ({ signInWithGoogle: mocks.signInWithGoogle }));

describe("ACCOUNT-01 ACCOUNT-02 signIn", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    dismissToast();
    accountPageStore.setState(accountPageStore.getInitialState(), true);
    mocks.signInWithGoogle.mockReset();
    mocks.signInWithGoogle.mockResolvedValue(undefined);
  });

  it("announces a successful sign-in", async () => {
    // Given: Use this case's inputs and any shared test setup.
    render(<ToastViewport />);

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await signIn();
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed in.");
  });

  it("replaces a handled failure with success when retried", async () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.signInWithGoogle.mockRejectedValueOnce(new Error("Action failed"));
    render(<ToastViewport />);

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await signIn();
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to sign in.");

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await signIn();
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed in.");
  });
});
