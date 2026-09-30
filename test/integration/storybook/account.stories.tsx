import type { StoryObj } from "@storybook/react-vite";
import type { User } from "firebase/auth";
import { expect, mocked, waitFor } from "storybook/test";
import { replaceAuthSession, signInWithGoogle, signOutCurrentUser } from "@/entities/auth";
import { routeMeta, state, prepareWith } from "./support";

const meta = {
  ...routeMeta,
  title: "Integration/Account",
  parameters: { ...routeMeta.parameters, page: { ...state, path: "/account" } },
};
export default meta;
type Story = StoryObj<typeof meta>;
const user = { uid: "linked-user" } as User;
function account(linked: boolean) {
  replaceAuthSession({
    status: "authenticated",
    uid: linked ? "linked-user" : "anonymous-user",
    displayName: linked ? "Test User" : null,
    isAnonymous: !linked,
  });
}
const linked = prepareWith(() => account(true));
export const SignIn: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-ACCOUNT-01 Announce sign-in and receive the linked identity", async () => {
      mocked(signInWithGoogle).mockResolvedValueOnce(user);
      await userEvent.click(await canvas.findByRole("button", { name: "Sign in with Google" }));
      await expect(await canvas.findByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed in.");
      account(true);
      await expect(await canvas.findByText("Signed in with Google")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Sign out" })).toBeEnabled();
    });
  },
};
export const SignOut: Story = {
  beforeEach: linked,
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-ACCOUNT-02 Announce sign-out and receive the anonymous identity", async () => {
      mocked(signOutCurrentUser).mockResolvedValueOnce(undefined);
      await userEvent.click(await canvas.findByRole("button", { name: "Sign out" }));
      await expect(await canvas.findByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed out.");
      account(false);
      await expect(await canvas.findByText("Anonymous account")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
    });
  },
};
function pendingStory(isLinked: boolean): Story {
  return {
    ...(isLinked ? { beforeEach: linked } : {}),
    play: async ({ canvas, userEvent, step }) => {
      await step(
        isLinked ? "STORYBOOK-ACCOUNT-04 Disable pending sign-out" : "STORYBOOK-ACCOUNT-03 Disable pending sign-in",
        async () => {
          const pending = Promise.withResolvers<User>();
          const name = isLinked ? "Sign out" : "Sign in with Google";
          if (isLinked)
            mocked(signOutCurrentUser).mockImplementationOnce(async () => {
              await pending.promise;
            });
          else mocked(signInWithGoogle).mockImplementationOnce(() => pending.promise);
          try {
            await userEvent.click(await canvas.findByRole("button", { name }));
            await expect(canvas.getByRole("button", { name })).toBeDisabled();
            pending.resolve(user);
            await waitFor(() => expect(canvas.getByRole("button", { name })).toBeEnabled());
          } finally {
            pending.resolve(user);
          }
        }
      );
    },
  };
}
export const PendingSignIn = pendingStory(false);
export const PendingSignOut = pendingStory(true);
export const Japanese: Story = {
  beforeEach: linked,
  parameters: { locale: "ja" },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-ACCOUNT-05 Localize the account without translating its profile", async () => {
      await expect(await canvas.findByRole("heading", { name: "アカウント" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "ログアウト" })).toBeEnabled();
      await expect(canvas.getByText("Test User")).toBeVisible();
    });
  },
};
