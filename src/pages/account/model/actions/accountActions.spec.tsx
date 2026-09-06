import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { getI18n } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

import { accountPageStore as store } from "../store";
import { signIn } from "./signIn";
import { signOut } from "./signOut";

const mocks = vi.hoisted(() => ({
  action: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("../../api/signInWithGoogle", () => ({ signInWithGoogle: mocks.action }));
vi.mock("../../api/signOutCurrentUser", () => ({ signOutCurrentUser: mocks.action }));

const deferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
};

describe.each([
  {
    action: signIn,
    name: "signIn",
    success: "Signed in.",
    failure: "Unable to sign in.",
    japanese: "ログインしました。",
  },
  {
    action: signOut,
    name: "signOut",
    success: "Signed out.",
    failure: "Unable to sign out.",
    japanese: "ログアウトしました。",
  },
] as const)("ACCOUNT-02 ACCOUNT-03 ACCOUNT-05 $name", ({ action, name, success, failure, japanese }) => {
  beforeEach(() => {
    store.setState(store.getInitialState(), true);
    mocks.action.mockReset();
    mocks.action.mockResolvedValue(undefined);
    dismissToast();
  });

  afterEach(() => dismissToast());

  it("keeps operation pending when requested again before completion", async () => {
    render(<ToastViewport />);
    const request = deferred<void>();
    mocks.action.mockReturnValue(request.promise);

    let operation!: Promise<void>;
    let duplicateOperation!: Promise<void>;
    act(() => {
      operation = action();
      duplicateOperation = action();
    });

    await actAsync(async () => {
      await duplicateOperation;
    });

    expect(store.getState()[name].pending).toBe(true);

    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(store.getState()[name].pending).toBe(false);
    expect(screen.getByRole("status")).toHaveTextContent(`Success: ${success}`);
  });

  it("allows the primary action to retry after a handled failure", async () => {
    render(<ToastViewport />);
    const error = new Error("Action failed");
    const retry = deferred<void>();
    mocks.action.mockRejectedValueOnce(error).mockReturnValueOnce(retry.promise);

    await actAsync(async () => {
      await expect(action()).resolves.toBeUndefined();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(`Error: ${failure}`);

    let retryOperation!: Promise<void>;
    act(() => {
      retryOperation = action();
    });

    expect(store.getState()[name].pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retryOperation;
    });

    expect(store.getState()[name].pending).toBe(false);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(`Success: ${success}`);
  });

  it("publishes a late failure and clears the pending state", async () => {
    render(<ToastViewport />);
    const request = deferred<void>();
    mocks.action.mockReturnValue(request.promise);
    let operation!: Promise<void>;

    act(() => {
      operation = action();
    });
    await actAsync(async () => {
      request.reject(new Error("Late failure"));
      await expect(operation).resolves.toBeUndefined();
    });

    expect(screen.getByRole("alert")).toHaveTextContent(`Error: ${failure}`);
    expect(store.getState()[name].pending).toBe(false);
  });

  it("uses the active language when an action completes after a language change", async () => {
    render(<ToastViewport />);
    const request = deferred<void>();
    mocks.action.mockReturnValue(request.promise);
    const operation = action();

    await actAsync(async () => {
      await getI18n().changeLanguage("ja");
      request.resolve();
      await operation;
    });

    expect(screen.getByRole("status")).toHaveTextContent(`成功: ${japanese}`);
    expect(screen.getByText(japanese)).toBeVisible();
  });
});
