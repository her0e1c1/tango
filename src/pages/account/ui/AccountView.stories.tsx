import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

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

export const Anonymous: Story = {};

export const SignedIn: Story = {
  args: { isLoggedIn: true, displayName: "Maya Tanaka", uid: "google-linked-user" },
};

export const SigningIn: Story = {
  args: { signInPending: true },
};

export const SigningOut: Story = {
  args: { ...SignedIn.args, signOutPending: true },
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
};

export const Dark: Story = {
  args: { ...SignedIn.args },
  globals: { theme: "dark" },
};

export const Mobile: Story = {
  ...LongIdentity,
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  ...LongIdentity,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  args: SignedIn.args ?? {},
  argTypes: { isLoggedIn: { control: "boolean" } },
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...LongIdentity,
  parameters: { locale: "ja" },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const DarkPending: Story = {
  args: { ...SignedIn.args, signInPending: true, signOutPending: true },
  argTypes: { isLoggedIn: { control: "boolean" } },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const SignOutFailed: Story = {
  args: { ...SignedIn.args, signOutFailed: true },
};
