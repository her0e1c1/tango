import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { AccountView } from "./AccountView";

const meta = {
  title: "Pages/Account/AccountView",
  component: AccountView,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: {
    isLoggedIn: false,
    displayName: null,
    uid: "anonymous-user",
    signInPending: false,
    signOutPending: false,
    onSignIn: fn(),
    onSignOut: fn(),
  },
} satisfies Meta<typeof AccountView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Anonymous: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText("Anonymous account")).toBeVisible();
    await expect(canvas.getByText("Not available")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Sign in with Google" }));
    await expect(args.onSignIn).toHaveBeenCalled();
  },
};

export const SignedIn: Story = {
  args: { isLoggedIn: true, displayName: "Maya Tanaka", uid: "google-linked-user" },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText("Signed in with Google")).toBeVisible();
    await expect(canvas.getByText("Maya Tanaka")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Sign out" }));
    await expect(args.onSignOut).toHaveBeenCalled();
  },
};

export const SigningIn: Story = {
  args: { signInPending: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Sign in with Google" });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
  },
};

export const SigningOut: Story = {
  args: { ...SignedIn.args, signOutPending: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Sign out" });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
  },
};

export const NoDisplayName: Story = {
  args: { ...SignedIn.args, displayName: null },
};

export const LongIdentity: Story = {
  args: {
    ...SignedIn.args,
    displayName: "Alexandra Catherine Montgomery-Wellington",
    uid: "google-user-with-a-very-long-unbroken-identifier-0123456789abcdefghijklmnopqrstuvwxyz",
  },
};

export const Japanese: Story = {
  args: { ...SignedIn.args },
  parameters: { locale: "ja" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 1, name: "アカウント" })).toBeVisible();
    await expect(canvas.getByText("Maya Tanaka")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "ログアウト" })).toBeEnabled();
  },
};

export const Dark: Story = {
  args: { ...SignedIn.args },
  globals: { theme: "dark" },
};

export const Mobile: Story = {
  ...LongIdentity,
  globals: { viewport: { value: "iphone5", isRotated: false } },
};
