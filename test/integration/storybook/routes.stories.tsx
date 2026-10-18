import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, mocked, waitFor } from "storybook/test";

import type { User } from "firebase/auth";
import { signInWithGoogle, signOutCurrentUser } from "@/entities/auth";
import { replaceAuthSession } from "@/entities/auth";
import { appI18n } from "@/app/i18n/instance";

import { ToastViewport } from "@/shared/ui/toast";
import { routes } from "@/shared/router";
import { APP_STORY_UID, type AppStoryParameters, prepareAppStory } from "@/storybook/appStory";
import type { CardId } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import { createCard, createDeck, createPreferences } from "@/test/factories";

import { appRoutes } from "@/app/routes";

const PAGE_STORY_DECK_ID: DeckId = "storybook-japanese";
const PAGE_STORY_SECONDARY_DECK_ID: DeckId = "storybook-math";
const PAGE_STORY_CARD_ID: CardId = "storybook-hello";

const timestamp = Date.UTC(2026, 6, 1, 9, 0, 0);

const pageStoryDecks: Deck[] = [
  createDeck({
    id: PAGE_STORY_DECK_ID,
    uid: APP_STORY_UID,
    name: "Japanese starter",
    category: "markdown",
    studyFilter: { selectedTags: ["greeting"], tagAndFilter: false },
    createdAt: timestamp - 14 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp,
  }),
  createDeck({
    id: PAGE_STORY_SECONDARY_DECK_ID,
    uid: APP_STORY_UID,
    name: "Everyday mathematics",
    category: "math",
    createdAt: timestamp - 30 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 24 * 60 * 60 * 1000,
  }),
];

const pageStoryCards = [
  createCard({
    id: PAGE_STORY_CARD_ID,
    deckId: PAGE_STORY_DECK_ID,
    uid: APP_STORY_UID,
    frontText: "Hello",
    backText: "こんにちは",
    tags: ["greeting"],
    uniqueKey: "storybook-hello",
    createdAt: timestamp - 10 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp,
  }),
  createCard({
    id: "storybook-good-morning",
    deckId: PAGE_STORY_DECK_ID,
    uid: APP_STORY_UID,
    frontText: "Good morning",
    backText: "おはようございます",
    tags: ["greeting", "polite"],
    uniqueKey: "storybook-good-morning",
    createdAt: timestamp - 9 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 60 * 60 * 1000,
  }),
  createCard({
    id: "storybook-thank-you",
    deckId: PAGE_STORY_DECK_ID,
    uid: APP_STORY_UID,
    frontText: "Thank you",
    backText: "ありがとうございます",
    tags: ["polite"],
    uniqueKey: "storybook-thank-you",
    createdAt: timestamp - 8 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 2 * 60 * 60 * 1000,
  }),
  createCard({
    id: "storybook-circle-area",
    deckId: PAGE_STORY_SECONDARY_DECK_ID,
    uid: APP_STORY_UID,
    frontText: "What is the area of a circle with radius r?",
    backText: "$\\pi r^2$",
    tags: ["geometry"],
    uniqueKey: "storybook-circle-area",
    createdAt: timestamp - 20 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 3 * 24 * 60 * 60 * 1000,
  }),
];

const pageStoryState = {
  decks: pageStoryDecks,
  cards: pageStoryCards,
  preferences: createPreferences({
    maxNumberOfCardsToLearn: 20,
  }),
  sessionsByDeckId: {
    [PAGE_STORY_DECK_ID]: {
      sessionId: "storybook-session-japanese",
      lastStudiedAt: timestamp,
      startedAt: timestamp - 5 * 60 * 1000,
      cardOrderIds: pageStoryCards.filter((card) => card.deckId === PAGE_STORY_DECK_ID).map((card) => card.id),
      currentIndex: 1,
    },
  },
} satisfies Omit<AppStoryParameters, "path">;

const AppRoutes = ({ path }: { path: string }) => {
  const [router] = useState(() => createMemoryRouter(appRoutes, { initialEntries: [path] }));
  useEffect(() => () => router.dispose(), [router]);
  return (
    <>
      <RouterProvider router={router} />
      <ToastViewport />
    </>
  );
};

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  title: "Integration/Routes",
  render: (_args, context) => (
    <AppRoutes key={context.id} path={(context.parameters.page as AppStoryParameters).path} />
  ),
  beforeEach: prepareAppStory,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeckList: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckList.to() } },
};

export const DeckCreate: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckCreate.to() } },
};

export const CardList: Story = {
  parameters: { page: { ...pageStoryState, path: routes.cardList.to(PAGE_STORY_DECK_ID) } },
};

export const DeckForm: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckForm.to(PAGE_STORY_DECK_ID) } },
};

export const DeckStudyStart: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckStudyStart.to(PAGE_STORY_DECK_ID) } },
};

export const DeckStudy: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckStudy.to(PAGE_STORY_DECK_ID) } },
};

export const CardView: Story = {
  parameters: { page: { ...pageStoryState, path: routes.cardView.to(PAGE_STORY_CARD_ID) } },
};

export const CardForm: Story = {
  parameters: { page: { ...pageStoryState, path: routes.cardForm.to(PAGE_STORY_CARD_ID) } },
};

export const Settings: Story = {
  parameters: { page: { ...pageStoryState, path: routes.settings.to() } },
};

export const Account: Story = {
  parameters: { page: { ...pageStoryState, path: routes.account.to() } },
};

export const Import: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckImport.to() } },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-IMPORT-02 Import preview through route", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const file = new File(
        ['"storybook prompt","storybook answer","story","storybook-import"'],
        "storybook-import.csv",
        { type: "text/csv" }
      );

      await expect(canvas.queryByRole("heading", { name: "Review import" })).not.toBeInTheDocument();
      await expect(canvas.queryByRole("radio")).not.toBeInTheDocument();
      // When: Exercise `userEvent.upload` with the prepared inputs.
      await userEvent.upload(canvas.getByLabelText("Upload a csv file"), file);

      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { level: 2, name: "Review import" })).toBeVisible();
      await expect(canvas.getByText("1 valid")).toBeVisible();
      await expect(canvas.getByText("storybook answer")).toBeVisible();
    });
  },
};

export const NotFound: Story = {
  parameters: { page: { ...pageStoryState, path: "/not-found" } },
};

export const SettingsHomeShortcut: Story = {
  parameters: Settings.parameters ?? {},
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-SETTINGS-11 Navigate home with the settings shortcut", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(await canvas.findByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("t");
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
    });
  },
};

export const AccountHomeShortcut: Story = {
  parameters: Account.parameters ?? {},
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-09 Navigate home with the account shortcut", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(await canvas.findByRole("heading", { level: 1, name: "Account" })).toBeVisible();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("t");
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
    });
  },
};

export const AnonymousAccountIdentity: Story = {
  parameters: Account.parameters ?? {},
  beforeEach: async (context) => {
    await prepareAppStory(context);
    replaceAuthSession({ status: "authenticated", uid: "anonymous-user", displayName: null, isAnonymous: true });
  },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-06 Display the anonymous session identity", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      for (const text of ["Anonymous account", "Not available", "anonymous-user"])
        await expect(await canvas.findByText(text, { exact: true })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
      await expect(canvas.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    });
  },
};

export const LinkedAccountIdentity: Story = {
  parameters: Account.parameters ?? {},
  beforeEach: async (context) => {
    await prepareAppStory(context);
    replaceAuthSession({ status: "authenticated", uid: "linked-user", displayName: "Test User", isAnonymous: false });
  },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-06 Display the linked session identity", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      for (const text of ["Signed in with Google", "Test User", "linked-user"])
        await expect(await canvas.findByText(text, { exact: true })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Sign out" })).toBeEnabled();
      await expect(canvas.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
    });
    await step("STORYBOOK-ACCOUNT-08 Preserve profile values when changing language", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `appI18n.changeLanguage` with the prepared inputs.
      await appI18n.changeLanguage("ja");
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "アカウント" })).toBeVisible();
      await expect(canvas.getByText("Test User", { exact: true })).toBeVisible();
      await expect(canvas.getByText("linked-user", { exact: true })).toBeVisible();
      await expect(canvas.getByText("表示名", { exact: true })).toBeVisible();
      await expect(canvas.getByText("Googleでログイン済み", { exact: true })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "ログアウト" })).toBeEnabled();
    });
  },
};

const successfulUser = { uid: "linked-user" } as User;
const accountSession = (linked: boolean) =>
  replaceAuthSession({
    status: "authenticated",
    uid: linked ? "linked-user" : "anonymous-user",
    displayName: linked ? "Test User" : null,
    isAnonymous: !linked,
  });

const authRetryStory = (linked: boolean): Story => ({
  parameters: Account.parameters ?? {},
  beforeEach: async (context) => {
    await prepareAppStory(context);
    accountSession(linked);
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const name = linked ? "Sign out" : "Sign in with Google";
    const success = linked ? "Signed out." : "Signed in.";
    const failureMessage = linked ? "Unable to sign out." : "Unable to sign in.";
    await step("STORYBOOK-ACCOUNT-10 Retry a failed authentication operation", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await canvas.findByRole("button", { name });
      const operation = linked ? mocked(signOutCurrentUser) : mocked(signInWithGoogle);
      operation.mockRejectedValueOnce(new Error("Authentication failed"));
      if (linked) mocked(signOutCurrentUser).mockResolvedValueOnce(undefined);
      else mocked(signInWithGoogle).mockResolvedValueOnce(successfulUser);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("alert")).toHaveTextContent(failureMessage);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name }));
      // Then: Verify the expected result in the assertions below.
      await waitFor(() => expect(canvas.queryByRole("alert")).not.toBeInTheDocument());
      await expect(canvas.getByRole("status", { name: "Toast notifications" })).toHaveTextContent(success);
    });
  },
});
export const SignInRetry = authRetryStory(false);
export const SignOutRetry = authRetryStory(true);

export const AccountFailureSurvivesNavigation: Story = {
  parameters: Account.parameters ?? {},
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-11 Preserve a visible failure across navigation", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      mocked(signInWithGoogle).mockRejectedValueOnce(new Error("Authentication failed"));
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Sign in with Google" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to sign in.");
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("t");
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
      await expect(canvas.getByRole("alert")).toHaveTextContent("Unable to sign in.");
    });
  },
};

const authLateFailureStory = (linked: boolean): Story => ({
  parameters: Account.parameters ?? {},
  beforeEach: async (context) => {
    await prepareAppStory(context);
    accountSession(linked);
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-12 Announce an authentication failure after leaving the page", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await canvas.findByRole("button", { name: linked ? "Sign out" : "Sign in with Google" });
      const pending = Promise.withResolvers<never>();
      void pending.promise.catch(() => undefined);
      if (linked) mocked(signOutCurrentUser).mockImplementationOnce(() => pending.promise);
      else mocked(signInWithGoogle).mockImplementationOnce(() => pending.promise);
      try {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(await canvas.findByRole("button", { name: linked ? "Sign out" : "Sign in with Google" }));
        await userEvent.keyboard("t");
        // Then: Verify the expected result in the assertions below.
        await expect(await canvas.findByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
        // When: Apply the operation or event under test.
        pending.reject(new Error("Authentication failed"));
        // Then: Verify the expected result in the assertions below.
        await expect(await canvas.findByRole("alert")).toHaveTextContent(
          linked ? "Unable to sign out." : "Unable to sign in."
        );
        await expect(canvas.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
      } finally {
        pending.reject(new Error("Story cleanup"));
      }
    });
  },
});
export const LateSignInFailure = authLateFailureStory(false);
export const LateSignOutFailure = authLateFailureStory(true);

export const JapaneseAuthenticationResult: Story = {
  parameters: { ...Account.parameters, locale: "ja" },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-13 Announce authentication success in Japanese", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await canvas.findByRole("button", { name: "Googleでログイン" });
      mocked(signInWithGoogle).mockResolvedValueOnce(successfulUser);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Googleでログイン" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("status", { name: "トースト通知" })).toHaveTextContent("ログインしました。");
    });
  },
};

export const IndependentAuthenticationPending: Story = {
  parameters: Account.parameters ?? {},
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-ACCOUNT-07 Keep concurrent authentication operations independent", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await canvas.findByRole("button", { name: "Sign in with Google" });
      const signingIn = Promise.withResolvers<User>();
      const signingOut = Promise.withResolvers<void>();
      mocked(signInWithGoogle).mockImplementationOnce(() => signingIn.promise);
      mocked(signOutCurrentUser).mockImplementationOnce(() => signingOut.promise);
      try {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(await canvas.findByRole("button", { name: "Sign in with Google" }));
        accountSession(true);
        await userEvent.click(await canvas.findByRole("button", { name: "Sign out" }));
        signingIn.resolve(successfulUser);
        // Then: Verify the expected result in the assertions below.
        await expect(await canvas.findByRole("status", { name: "Toast notifications" })).toHaveTextContent(
          "Signed in."
        );
        await expect(canvas.getByRole("button", { name: "Sign out" })).toBeDisabled();
        // When: Apply the operation or event under test.
        signingOut.resolve();
        replaceAuthSession({
          status: "authenticated",
          uid: "next-anonymous-user",
          displayName: null,
          isAnonymous: true,
        });
        // Then: Verify the expected result in the assertions below.
        await waitFor(() =>
          expect(canvas.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed out.")
        );
        await expect(canvas.getByText("next-anonymous-user")).toBeVisible();
        await expect(canvas.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
      } finally {
        signingIn.resolve(successfulUser);
        signingOut.resolve();
      }
    });
  },
};

const authReentryStory = (linked: boolean, failure: boolean): Story => ({
  parameters: Account.parameters ?? {},
  beforeEach: async (context) => {
    await prepareAppStory(context);
    accountSession(linked);
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const name = linked ? "Sign out" : "Sign in with Google";
    const success = linked ? "Signed out." : "Signed in.";
    const failureMessage = linked ? "Unable to sign out." : "Unable to sign in.";
    await step("STORYBOOK-ACCOUNT-14 Preserve pending authentication after re-entering the page", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await canvas.findByRole("button", { name });
      const pending = Promise.withResolvers<User>();
      if (linked)
        mocked(signOutCurrentUser)
          .mockImplementationOnce(async () => {
            await pending.promise;
          })
          .mockResolvedValueOnce(undefined);
      else
        mocked(signInWithGoogle)
          .mockImplementationOnce(() => pending.promise)
          .mockResolvedValueOnce(successfulUser);
      try {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(await canvas.findByRole("button", { name }));
        await userEvent.keyboard("t");
        // Then: Verify the expected result in the assertions below.
        await expect(await canvas.findByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: "Open account" }));
        // Then: Verify the expected result in the assertions below.
        await expect(await canvas.findByRole("button", { name })).toBeDisabled();
        // When: Apply the operation or event under test.
        if (failure) pending.reject(new Error("Authentication failed"));
        else pending.resolve(successfulUser);
        // Then: Verify the expected result in the assertions below.
        if (failure) await expect(await canvas.findByRole("alert")).toHaveTextContent(failureMessage);
        else
          await expect(await canvas.findByRole("status", { name: "Toast notifications" })).toHaveTextContent(success);
        await expect(canvas.getByRole("button", { name })).toBeEnabled();
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name }));
        // Then: Verify the expected result in the assertions below.
        await waitFor(() => expect(canvas.queryByRole("alert")).not.toBeInTheDocument());
        await expect(canvas.getByRole("status", { name: "Toast notifications" })).toHaveTextContent(success);
      } finally {
        pending.resolve(successfulUser);
      }
    });
  },
});
export const SignInReentrySuccess = authReentryStory(false, false);
export const SignInReentryFailure = authReentryStory(false, true);
export const SignOutReentrySuccess = authReentryStory(true, false);
export const SignOutReentryFailure = authReentryStory(true, true);
