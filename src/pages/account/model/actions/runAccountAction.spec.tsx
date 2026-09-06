import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { getI18n } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

import { runAccountAction } from "./runAccountAction";
import { createAccountPageStore } from "../store";

const mocks = vi.hoisted(() => ({
  action: vi.fn<() => Promise<unknown>>(),
}));

const deferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
};

describe("ACCOUNT-02 ACCOUNT-03 ACCOUNT-05 runAccountAction", () => {
  beforeEach(() => {
    mocks.action.mockReset();
    mocks.action.mockResolvedValue(undefined);
    dismissToast();
  });

  afterEach(() => dismissToast());

  it("keeps operation pending when requested again before completion", async () => {
    render(<ToastViewport />);
    const request = deferred<void>();
    mocks.action.mockReturnValue(request.promise);
    const store = createAccountPageStore();

    let operation!: Promise<void>;
    let duplicateOperation!: Promise<void>;
    act(() => {
      operation = runAccountAction(mocks.action, store, {
        operation: "signIn",
        successKey: "account.toast.signInSuccess",
        failureKey: "account.toast.signInFailure",
      });
      duplicateOperation = runAccountAction(mocks.action, store, {
        operation: "signIn",
        successKey: "account.toast.signInSuccess",
        failureKey: "account.toast.signInFailure",
      });
    });

    await actAsync(async () => {
      await duplicateOperation;
    });

    expect(store.getState().signIn.pending).toBe(true);

    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(store.getState().signIn.pending).toBe(false);
    expect(screen.getByRole("status")).toHaveTextContent("Success: Signed in.");
  });

  it("allows the primary action to retry after a handled failure", async () => {
    render(<ToastViewport />);
    const failure = new Error("Action failed");
    const retry = deferred<void>();
    mocks.action.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    const store = createAccountPageStore();

    await actAsync(async () => {
      await expect(
        runAccountAction(mocks.action, store, {
          operation: "signIn",
          successKey: "account.toast.signInSuccess",
          failureKey: "account.toast.signInFailure",
        })
      ).resolves.toBeUndefined();
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Error: Unable to sign in.");

    let retryOperation!: Promise<void>;
    act(() => {
      retryOperation = runAccountAction(mocks.action, store, {
        operation: "signIn",
        successKey: "account.toast.signInSuccess",
        failureKey: "account.toast.signInFailure",
      });
    });

    expect(store.getState().signIn.pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retryOperation;
    });

    expect(store.getState().signIn.pending).toBe(false);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Success: Signed in.");
  });

  it("publishes a late failure and clears the pending state", async () => {
    render(<ToastViewport />);
    const request = deferred<void>();
    mocks.action.mockReturnValue(request.promise);
    const store = createAccountPageStore();
    let operation!: Promise<void>;

    act(() => {
      operation = runAccountAction(mocks.action, store, {
        operation: "signIn",
        successKey: "account.toast.signInSuccess",
        failureKey: "account.toast.signInFailure",
      });
    });
    await actAsync(async () => {
      request.reject(new Error("Late failure"));
      await expect(operation).resolves.toBeUndefined();
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Error: Unable to sign in.");
    expect(store.getState().signIn.pending).toBe(false);
  });

  it("uses the active language when an action completes after a language change", async () => {
    render(<ToastViewport />);
    const request = deferred<void>();
    const store = createAccountPageStore();
    const operation = runAccountAction(() => request.promise, store, {
      operation: "signIn",
      successKey: "account.toast.signInSuccess",
      failureKey: "account.toast.signInFailure",
    });

    await actAsync(async () => {
      await getI18n().changeLanguage("ja");
      request.resolve();
      await operation;
    });

    expect(screen.getByRole("status")).toHaveTextContent("成功: ログインしました。");
    expect(screen.getByText("ログインしました。")).toBeVisible();
  });
});
