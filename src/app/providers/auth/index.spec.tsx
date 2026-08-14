import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { useAuthSession } from "@/entities/auth";

type AuthSessionState = ReturnType<typeof useAuthSession>;

const mocks = vi.hoisted(() => ({
  authState: { status: "initializing" } as AuthSessionState,
  startAuthSession: vi.fn(),
  stopAuthSession: vi.fn(),
}));

vi.mock("@/app/providers/auth/lifecycle", () => ({
  startAuthSession: mocks.startAuthSession,
}));
vi.mock("@/entities/auth", () => ({
  useAuthSession: () => mocks.authState,
}));

import { AuthProvider } from "./index";

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.startAuthSession.mockReturnValue(mocks.stopAuthSession);
    mocks.authState = { status: "authenticated", uid: "test-user", isAnonymous: true, displayName: null };
  });

  it("starts and stops the authentication lifecycle", () => {
    const view = render(
      <AuthProvider>
        <div>Content</div>
      </AuthProvider>
    );

    expect(mocks.startAuthSession).toHaveBeenCalledOnce();

    view.unmount();

    expect(mocks.stopAuthSession).toHaveBeenCalledOnce();
  });

  it("shows startup feedback while authentication is in progress", () => {
    mocks.authState = { status: "initializing" };
    const view = render(
      <AuthProvider>
        <div>Content</div>
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Starting Tango…" })).toBeInTheDocument();
    expect(screen.queryByText("Content")).toBeNull();

    mocks.authState = { status: "unauthenticated" };
    view.rerender(
      <AuthProvider>
        <div>Content</div>
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Starting Tango…" })).toBeInTheDocument();
    expect(screen.queryByText("Content")).toBeNull();

    mocks.authState = { status: "authenticating", attemptId: Symbol("attempt-a") };
    view.rerender(
      <AuthProvider>
        <div>Content</div>
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Starting Tango…" })).toBeInTheDocument();
    expect(screen.queryByText("Content")).toBeNull();
  });

  it("shows startup errors and reloads on request", () => {
    const reload = vi.fn();
    mocks.authState = { status: "error", error: new Error("auth failed") };
    render(
      <AuthProvider reload={reload}>
        <div>Content</div>
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Unable to start Tango" })).toBeInTheDocument();
    expect(screen.queryByText("Content")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("renders children when authenticated", () => {
    render(
      <AuthProvider>
        <div>Content</div>
      </AuthProvider>
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
