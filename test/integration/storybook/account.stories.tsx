import type { StoryObj } from "@storybook/react-vite";
import type { User } from "firebase/auth";
import { expect, mocked, waitFor } from "storybook/test";
import { replaceAuthSession, signInWithGoogle, signOutCurrentUser } from "@/entities/auth";
import { editCard } from "@/entities/card";
import { submit } from "@/pages/card-edit/model/actions/submit";
import { replaceRemoteCards } from "@/test/utils/entityFixtures";
import { APP_STORY_UID } from "@/storybook/appStory";
import { routeMeta, state, prepareWith, cards } from "./support";

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

function concurrentCardResult(leave: boolean, failSave: boolean): Story {
  const cardMessage = failSave ? "Unable to save changes. Try again." : "Updated card “Saved content”.";
  return {
    beforeEach: prepareWith(() =>
      replaceAuthSession({ status: "authenticated", uid: APP_STORY_UID, displayName: "Owner", isAnonymous: false })
    ),
    play: async ({ canvas, userEvent, step }) => {
      await step("STORYBOOK-ACCOUNT-15 Preserve both Card save and refused sign-out results", async () => {
        // Given: The real Card action is saving while Account is available; only external I/O is deferred.
        const card = cards[0]!;
        const values = { frontText: "Saved content", backText: card.backText, tags: card.tags };
        const write = Promise.withResolvers<void>();
        const logout = Promise.withResolvers<void>();
        mocked(editCard).mockImplementationOnce(() => write.promise);
        mocked(signOutCurrentUser).mockImplementationOnce(async () => {
          await logout.promise;
          replaceAuthSession({ status: "authenticated", uid: APP_STORY_UID, displayName: "Owner", isAnonymous: false });
          throw new Error("Sign-out refused");
        });
        const saved = submit({ cardId: card.id, values });
        try {
          // When: Signing out fails after the Card result is ready, on Account or after leaving for Home.
          await userEvent.click(await canvas.findByRole("button", { name: "Sign out" }));
          if (leave) await userEvent.keyboard("t");
          replaceAuthSession({ status: "initializing" });
          if (failSave) write.reject(new Error("Save refused"));
          else {
            replaceRemoteCards(cards.map((item) => (item.id === card.id ? { ...item, ...values } : item)));
            write.resolve();
          }
          await Promise.resolve();
          logout.resolve();
          await saved;
          // Then: Neither result replaces the other, and the route stays where the user left it.
          await expect(
            await canvas.findByRole("heading", { level: 1, name: leave ? "Decks" : "Account" })
          ).toBeVisible();
          const failure =
            "Unable to sign out. If changes are pending, reconnect and let them sync before trying again.";
          await expect(await canvas.findByText(failure, { exact: true })).toBeVisible();
          await expect(
            await canvas.findByText(cardMessage, {
              exact: true,
            })
          ).toBeVisible();
          await expect(canvas.getAllByRole("button", { name: "Dismiss notification" })).toHaveLength(leave ? 2 : 1);
          await expect(
            canvas.getByRole("button", {
              name: "Dismiss notification",
              description: cardMessage,
            })
          ).toBeVisible();
          if (leave)
            await expect(
              canvas.getByRole("button", { name: "Dismiss notification", description: failure })
            ).toBeVisible();
          await expect(canvas.getByRole("status", { name: "Toast notifications" })).toHaveAttribute(
            "aria-atomic",
            "false"
          );
        } finally {
          write.resolve();
          logout.resolve();
          await saved;
        }
      });
    },
  };
}
export const CardSuccessWithInlineSignOutFailure = concurrentCardResult(false, false);
export const CardFailureWithInlineSignOutFailure = concurrentCardResult(false, true);
export const CardSuccessWithLateSignOutFailure = concurrentCardResult(true, false);
export const CardFailureWithLateSignOutFailure = concurrentCardResult(true, true);

export const InlineFailureVisitBoundary: Story = {
  beforeEach: linked,
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-ACCOUNT-15 Clear inline failure when its Account visit ends", async () => {
      // Given: A refused sign-out is displayed inline on Account.
      mocked(signOutCurrentUser).mockRejectedValueOnce(new Error("Refused"));
      await userEvent.click(await canvas.findByRole("button", { name: "Sign out" }));
      await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to sign out.");
      // When: Leave Account and return on a new visit.
      await userEvent.keyboard("t");
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "Open account" }));
      // Then: The previous visit's failure does not reappear.
      await expect(await canvas.findByRole("heading", { name: "Account" })).toBeVisible();
      await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    });
  },
};
export const InlineFailureIdentityBoundary: Story = {
  beforeEach: linked,
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-ACCOUNT-15 Clear inline failure across an identity boundary", async () => {
      // Given: A refused sign-out is displayed for the original owner.
      mocked(signOutCurrentUser).mockRejectedValueOnce(new Error("Refused"));
      await userEvent.click(await canvas.findByRole("button", { name: "Sign out" }));
      await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to sign out.");
      // When: Another identity becomes active, then the original owner returns.
      account(false);
      await expect(await canvas.findByRole("button", { name: "Sign in with Google" })).toBeVisible();
      account(true);
      // Then: Neither identity retains the old inline error.
      await expect(await canvas.findByRole("button", { name: "Sign out" })).toBeVisible();
      await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    });
  },
};
