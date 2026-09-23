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
  it("offers shared recovery on initialization failure", () => {
    replaceAuthSession({ status: "error", error: new Error("storage failure") });
    render(
      <AuthProvider>
        <p>Ready</p>
      </AuthProvider>
    );
    expect(screen.getByText("Unable to start Tango")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Clear cache and reload" })).toBeVisible();
    expect(screen.getByText("Authentication could not be initialized.")).toBeVisible();
    expect(screen.queryByText("Ready")).not.toBeInTheDocument();
  });
});
