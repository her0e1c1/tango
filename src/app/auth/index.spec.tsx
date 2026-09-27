import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { replaceAuthSession } from "@/entities/auth";
import { AuthProvider } from "./index";
vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("./lifecycle", () => ({ startAuthSession: () => () => undefined }));
describe("Authentication feedback [ACCOUNT-04 SETTINGS-04]", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));
  it("withholds editable content until identity is known", () => {
    render(
      <AuthProvider>
        <p>Ready</p>
      </AuthProvider>
    );
    expect(screen.queryByText("Ready")).not.toBeInTheDocument();
    expect(screen.getByText("Starting Tango…")).toBeVisible();
    act(() => replaceAuthSession({ status: "authenticated", uid: "anonymous", isAnonymous: true, displayName: null }));
    expect(screen.getByText("Ready")).toBeVisible();
  });
  it("NAVIGATION-22 offers local data recovery on Firestore initialization failure", () => {
    replaceAuthSession({ status: "error", source: "firestore", error: new Error("storage failure") });
    render(
      <AuthProvider>
        <p>Ready</p>
      </AuthProvider>
    );
    expect(screen.getByText("Unable to start Tango")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByText(/Your sign-in, settings and app cache are kept/)).toBeVisible();
    expect(screen.getByText(/Authentication or saved data could not be initialized.*storage failure/)).toBeVisible();
    expect(screen.getByText(/Anonymous data cannot be recovered/)).toBeVisible();
    expect(screen.queryByText("Ready")).not.toBeInTheDocument();
  });
  it("NAVIGATION-03 keeps authentication failures reload-only", () => {
    replaceAuthSession({ status: "error", source: "auth", error: new Error("sign-in failed") });
    render(
      <AuthProvider>
        <p>Ready</p>
      </AuthProvider>
    );
    expect(screen.getByText(/sign-in failed/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Clear local database and reload" })).not.toBeInTheDocument();
  });
});
