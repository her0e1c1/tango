import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { getI18n } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { actAsync } from "@/test/act";

import { accountPageStore as store } from "../store";
import { signIn } from "./signIn";
import { signOut } from "./signOut";

const mocks = vi.hoisted(() => ({
  action: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("@/entities/auth", () => ({
  signInWithGoogle: mocks.action,
  signOutCurrentUser: mocks.action,
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
    // Given: Establish the shared setup used by the following cases.
    store.setState(store.getInitialState(), true);
    mocks.action.mockReset();
    mocks.action.mockResolvedValue(undefined);
    dismissToast();
  });

  afterEach(() => dismissToast());

  it("keeps operation pending when requested again before completion", async () => {
    // Given: Prepare `request`, `operation`, `duplicateOperation` and any shared test state below.
    render(<ToastViewport />);
    const request = deferred<void>();
    mocks.action.mockReturnValue(request.promise);

    let operation!: Promise<void>;
    let duplicateOperation!: Promise<void>;
    act(() => {
      operation = action();
      duplicateOperation = action();
    });

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await duplicateOperation;
    });

    // Then: Verify the expected result in the assertions below.
    expect(store.getState()[name].pending).toBe(true);

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    // Then: Verify the expected result in the assertions below.
    expect(store.getState()[name].pending).toBe(false);
    expect(screen.getByRole("status")).toHaveTextContent(`Success: ${success}`);
  });

  it("allows the primary action to retry after a handled failure", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<ToastViewport />);
    const error = new Error("Action failed");
    const retry = deferred<void>();
    mocks.action.mockRejectedValueOnce(error).mockReturnValueOnce(retry.promise);

    // Then: Verify the expected result in the assertions below.
    await actAsync(async () => {
      await expect(action()).resolves.toBeUndefined();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(`Error: ${failure}`);

    let retryOperation!: Promise<void>;
    // When: Exercise `act` with the prepared inputs.
    act(() => {
      retryOperation = action();
    });

    // Then: Verify the expected result in the assertions below.
    expect(store.getState()[name].pending).toBe(true);

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      retry.resolve();
      await retryOperation;
    });

    // Then: Verify the expected result in the assertions below.
    expect(store.getState()[name].pending).toBe(false);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(`Success: ${success}`);
  });

  it("publishes a late failure and clears the pending state", async () => {
    // Given: Prepare `request`, `operation` and any shared test state below.
    render(<ToastViewport />);
    const request = deferred<void>();
    mocks.action.mockReturnValue(request.promise);
    let operation!: Promise<void>;

    // When: Exercise `act` with the prepared inputs.
    act(() => {
      operation = action();
    });
    // Then: Verify the expected result in the assertions below.
    await actAsync(async () => {
      request.reject(new Error("Late failure"));
      await expect(operation).resolves.toBeUndefined();
    });

    expect(screen.getByRole("alert")).toHaveTextContent(`Error: ${failure}`);
    expect(store.getState()[name].pending).toBe(false);
  });

  it("uses the active language when an action completes after a language change", async () => {
    // Given: Prepare `request`, `operation` and any shared test state below.
    render(<ToastViewport />);
    const request = deferred<void>();
    mocks.action.mockReturnValue(request.promise);
    const operation = action();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await getI18n().changeLanguage("ja");
      request.resolve();
      await operation;
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status")).toHaveTextContent(`成功: ${japanese}`);
    expect(screen.getByText(japanese)).toBeVisible();
  });
});
