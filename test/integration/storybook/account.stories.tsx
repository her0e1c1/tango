import type { StoryObj } from "@storybook/react-vite";
import type { User } from "firebase/auth";
import { expect, mocked, waitFor } from "storybook/test";
import { replaceAuthSession, signInWithGoogle, signOutCurrentUser } from "@/entities/auth";
import { routeMeta, state, prepareWith } from "./support";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-01 Announce sign-in and receive the linked identity", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      mocked(signInWithGoogle).mockResolvedValueOnce(user);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Sign in with Google" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed in.");
      // When: Exercise `account` with the prepared inputs.
      account(true);
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByText("Signed in with Google")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Sign out" })).toBeEnabled();
    });
  },
};
export const SignOut: Story = {
  beforeEach: linked,
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-02 Announce sign-out and receive the anonymous identity", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      mocked(signOutCurrentUser).mockResolvedValueOnce(undefined);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Sign out" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed out.");
      // When: Exercise `account` with the prepared inputs.
      account(false);
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByText("Anonymous account")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
    });
  },
};
function pendingStory(isLinked: boolean): Story {
  return {
    ...(isLinked ? { beforeEach: linked } : {}),
    play: async ({ canvas, userEvent, step }) => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await step(
        isLinked ? "STORYBOOK-ACCOUNT-04 Disable pending sign-out" : "STORYBOOK-ACCOUNT-03 Disable pending sign-in",
        async () => {
          // Given: Use the rendered story, its args, parameters, and any setup below.
          const pending = Promise.withResolvers<User>();
          const name = isLinked ? "Sign out" : "Sign in with Google";
          if (isLinked)
            mocked(signOutCurrentUser).mockImplementationOnce(async () => {
              await pending.promise;
            });
          else mocked(signInWithGoogle).mockImplementationOnce(() => pending.promise);
          try {
            // Given: Use the current iteration or branch inputs from the enclosing case.
            // When: Exercise `userEvent.click` with the prepared inputs.
            await userEvent.click(await canvas.findByRole("button", { name }));
            // Then: Verify the expected result in the assertions below.
            await expect(canvas.getByRole("button", { name })).toBeDisabled();
            // When: Apply the operation or event under test.
            pending.resolve(user);
            // Then: Verify the expected result in the assertions below.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-05 Localize the account without translating its profile", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "アカウント" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "ログアウト" })).toBeEnabled();
      await expect(canvas.getByText("Test User")).toBeVisible();
    });
  },
};
