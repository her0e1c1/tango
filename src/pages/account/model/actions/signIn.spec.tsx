import { renderHook } from "@testing-library/react";
import { getI18n } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { showToast } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

import { signIn } from "./signIn";
import { useAccountPageState } from "../useAccountPageState";

const mocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn<() => Promise<void>>(),
}));

vi.mock("../../api/signInWithGoogle", () => ({ signInWithGoogle: mocks.signInWithGoogle }));
vi.mock("@/shared/ui/toast", () => ({ showToast: vi.fn() }));

describe("ACCOUNT-02 signIn", () => {
  beforeEach(async () => {
    await getI18n().changeLanguage("en");
    mocks.signInWithGoogle.mockReset();
    mocks.signInWithGoogle.mockResolvedValue(undefined);
    vi.mocked(showToast).mockClear();
  });

  it("reports successful completion", async () => {
    renderHook(useAccountPageState);
    await actAsync(signIn);

    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: "Signed in.", tone: "success" });
  });

  it("reports a failure and permits a successful retry", async () => {
    mocks.signInWithGoogle.mockRejectedValueOnce(new Error("Authentication failed"));
    const { result } = renderHook(useAccountPageState);
    await actAsync(signIn);

    expect(showToast).toHaveBeenLastCalledWith({ message: "Unable to sign in.", tone: "error" });
    expect(result.current.signIn.pending).toBe(false);

    await actAsync(signIn);

    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed in.", tone: "success" });
    expect(result.current.signIn.pending).toBe(false);
  });
});
