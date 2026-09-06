import { render, screen } from "@testing-library/react";
import { getI18n } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

import { accountPageStore } from "../store";
import { signOut } from "./signOut";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn<() => Promise<void>>(),
}));

vi.mock("../../api/signOutCurrentUser", () => ({ signOutCurrentUser: mocks.signOutCurrentUser }));

describe("ACCOUNT-03 signOut", () => {
  beforeEach(() => {
    dismissToast();
    accountPageStore.setState(accountPageStore.getInitialState(), true);
    mocks.signOutCurrentUser.mockReset();
    mocks.signOutCurrentUser.mockResolvedValue(undefined);
  });

  it("announces a successful sign-out", async () => {
    render(<ToastViewport />);

    await actAsync(async () => {
      await signOut(getI18n().t);
    });

    expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed out.");
  });

  it("replaces a handled failure with success when retried", async () => {
    mocks.signOutCurrentUser.mockRejectedValueOnce(new Error("Action failed"));
    render(<ToastViewport />);

    await actAsync(async () => {
      await signOut(getI18n().t);
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to sign out.");

    await actAsync(async () => {
      await signOut(getI18n().t);
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed out.");
  });
});
