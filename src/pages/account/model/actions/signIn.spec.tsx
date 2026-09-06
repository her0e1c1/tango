import { render, screen } from "@testing-library/react";
import { getI18n } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

import { accountPageStore } from "../store";
import { signIn } from "./signIn";

const mocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("../../api/signInWithGoogle", () => ({ signInWithGoogle: mocks.signInWithGoogle }));

describe("ACCOUNT-01 ACCOUNT-02 signIn", () => {
  beforeEach(() => {
    dismissToast();
    accountPageStore.setState(accountPageStore.getInitialState(), true);
    mocks.signInWithGoogle.mockReset();
    mocks.signInWithGoogle.mockResolvedValue(undefined);
  });

  it("announces a successful sign-in", async () => {
    render(<ToastViewport />);

    await actAsync(async () => {
      await signIn(getI18n().t);
    });

    expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed in.");
  });

  it("replaces a handled failure with success when retried", async () => {
    mocks.signInWithGoogle.mockRejectedValueOnce(new Error("Action failed"));
    render(<ToastViewport />);

    await actAsync(async () => {
      await signIn(getI18n().t);
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to sign in.");

    await actAsync(async () => {
      await signIn(getI18n().t);
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed in.");
  });
});
