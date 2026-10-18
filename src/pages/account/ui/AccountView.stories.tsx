import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { AccountView } from "./AccountView";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
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
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-01 Anonymous account", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(canvas.getByText("Anonymous account")).toBeVisible();
      await expect(canvas.getByText("Not available")).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Sign in with Google" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSignIn).toHaveBeenCalled();
    });
  },
};

export const SignedIn: Story = {
  args: { isLoggedIn: true, displayName: "Maya Tanaka", uid: "google-linked-user" },
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-02 Signed-in account", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(canvas.getByText("Signed in with Google")).toBeVisible();
      await expect(canvas.getByText("Maya Tanaka")).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Sign out" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSignOut).toHaveBeenCalled();
    });
  },
};

export const SigningIn: Story = {
  args: { signInPending: true },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-03 Sign-in pending", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const button = canvas.getByRole("button", { name: "Sign in with Google" });
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute("aria-busy", "true");
    });
  },
};

export const SigningOut: Story = {
  args: { ...SignedIn.args, signOutPending: true },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-04 Sign-out pending", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const button = canvas.getByRole("button", { name: "Sign out" });
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute("aria-busy", "true");
    });
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
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-05 Japanese account", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Evaluate `canvas.getByRole` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("heading", { level: 1, name: "アカウント" })).toBeVisible();
      await expect(canvas.getByText("Maya Tanaka")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "ログアウト" })).toBeEnabled();
    });
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
