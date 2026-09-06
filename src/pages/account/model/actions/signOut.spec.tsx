import { renderHook } from "@testing-library/react";
import { getI18n } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { showToast } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

import { signOut } from "./signOut";
import { useAccountPageState } from "../useAccountPageState";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn<() => Promise<void>>(),
}));

vi.mock("../../api/signOutCurrentUser", () => ({ signOutCurrentUser: mocks.signOutCurrentUser }));
vi.mock("@/shared/ui/toast", () => ({ showToast: vi.fn() }));

describe("ACCOUNT-03 signOut", () => {
  beforeEach(async () => {
    await getI18n().changeLanguage("en");
    mocks.signOutCurrentUser.mockReset();
    mocks.signOutCurrentUser.mockResolvedValue(undefined);
    vi.mocked(showToast).mockClear();
  });

  it("reports successful completion", async () => {
    renderHook(useAccountPageState);
    await actAsync(signOut);

    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: "Signed out.", tone: "success" });
  });

  it("reports a failure and permits a successful retry", async () => {
    mocks.signOutCurrentUser.mockRejectedValueOnce(new Error("Authentication failed"));
    const { result } = renderHook(useAccountPageState);
    await actAsync(signOut);

    expect(showToast).toHaveBeenLastCalledWith({ message: "Unable to sign out.", tone: "error" });
    expect(result.current.signOut.pending).toBe(false);

    await actAsync(signOut);

    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed out.", tone: "success" });
    expect(result.current.signOut.pending).toBe(false);
  });
});
