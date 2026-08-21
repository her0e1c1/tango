import type { User, UserCredential } from "firebase/auth";

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { getAuthSession, replaceAuthSession } from "@/entities/auth";
import { clearStudySessions } from "@/entities/study-session";

const firebaseAuth = vi.hoisted(() => ({
  observer: undefined as ((user: User | null) => void) | undefined,
  observing: false,
  signIn: (() => new Promise<UserCredential>(() => undefined)) as () => Promise<UserCredential>,
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({
  onIdTokenChanged: (_auth: unknown, observer: (user: User | null) => void) => {
    firebaseAuth.observer = observer;
    firebaseAuth.observing = true;
    return () => {
      firebaseAuth.observing = false;
    };
  },
  signInAnonymously: () => firebaseAuth.signIn(),
}));

import { AuthProvider } from "./index";

const createUser = (uid: string): User => ({ uid, isAnonymous: true, providerData: [] }) as unknown as User;

const publishUser = (user: User | null) => {
  act(() => {
    if (firebaseAuth.observing) firebaseAuth.observer?.(user);
  });
};

const ReloadableApp = () => {
  const [reloadRequested, setReloadRequested] = useState(false);
  return (
    <>
      <AuthProvider reload={() => setReloadRequested(true)}>
        <p>Authenticated content</p>
      </AuthProvider>
      {reloadRequested ? <p>Reload requested</p> : null}
    </>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    clearStudySessions();
    replaceAuthSession({ status: "initializing" });
    firebaseAuth.observer = undefined;
    firebaseAuth.observing = false;
    firebaseAuth.signIn = () => new Promise<UserCredential>(() => undefined);
  });

  it("keeps content hidden until Firebase publishes an authenticated user", () => {
    render(
      <AuthProvider>
        <p>Authenticated content</p>
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Starting Tango…" })).toBeVisible();
    expect(screen.queryByText("Authenticated content")).not.toBeInTheDocument();

    publishUser(null);
    expect(screen.getByRole("heading", { level: 1, name: "Starting Tango…" })).toBeVisible();
    expect(screen.queryByText("Authenticated content")).not.toBeInTheDocument();

    publishUser(createUser("user-a"));
    expect(screen.getByText("Authenticated content")).toBeVisible();
    expect(screen.queryByRole("heading", { level: 1, name: "Starting Tango…" })).not.toBeInTheDocument();
  });

  it("shows bootstrap failure feedback and responds to reload", async () => {
    firebaseAuth.signIn = () => Promise.reject(new Error("auth failed"));
    render(<ReloadableApp />);

    publishUser(null);

    expect(await screen.findByRole("heading", { level: 1, name: "Unable to start Tango" })).toBeVisible();
    expect(screen.queryByText("Authenticated content")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(screen.getByText("Reload requested")).toBeVisible();
  });

  it("ignores Firebase updates after the provider unmounts", () => {
    const view = render(
      <AuthProvider>
        <p>Authenticated content</p>
      </AuthProvider>
    );
    publishUser(createUser("user-a"));
    expect(screen.getByText("Authenticated content")).toBeVisible();

    view.unmount();
    publishUser(createUser("user-b"));

    expect(getAuthSession()).toMatchObject({ status: "authenticated", uid: "user-a" });
  });
});
