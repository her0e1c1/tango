import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";

import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";

import { SettingsForm as Form } from "./SettingsForm";

type SettingsFields = ComponentProps<typeof Form>["fields"];

const fields: SettingsFields = {
  showHeader: { checked: fixture.preferences.default.appearance.showHeader, onChange: () => undefined },
  showSwipeButtonList: { checked: fixture.preferences.default.controls.showSwipeButtonList, onChange: () => undefined },
  showSwipeFeedback: { checked: fixture.preferences.default.appearance.showSwipeFeedback, onChange: () => undefined },
  darkMode: { checked: fixture.preferences.default.appearance.darkMode, onChange: () => undefined },
  shuffled: { checked: fixture.preferences.default.study.shuffled, onChange: () => undefined },
  useCardInterval: { checked: fixture.preferences.default.study.useCardInterval, onChange: () => undefined },
  maxNumberOfCardsToLearn: {
    value: String(fixture.preferences.default.study.maxNumberOfCardsToLearn),
    min: 0,
    max: 100,
    onChange: () => undefined,
  },
  defaultAutoPlay: { checked: fixture.preferences.default.study.defaultAutoPlay, onChange: () => undefined },
  cardInterval: {
    value: String(fixture.preferences.default.study.cardInterval),
    min: 0,
    max: 60,
    onChange: () => undefined,
  },
};

const settingsFormProps = {
  fields,
  maxNumberOfCardsToLearn: fixture.preferences.default.study.maxNumberOfCardsToLearn,
  cardInterval: fixture.preferences.default.study.cardInterval,
  version: "1.2.3",
};

const meta = {
  title: "Pages/Settings/SettingsForm",
  component: Form,
  tags: ["autodocs"],
  parameters: { viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" } },
  args: settingsFormProps,
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {};
export const LoggedIn: Story = {
  args: {
    ...settingsFormProps,
    isLoggedIn: true,
    identity: { uid: "settings-user", displayName: "Settings User" },
  },
};
export const AccountPending: Story = {
  args: {
    accountPending: true,
    accountFeedback: <RemoteMutationNotice pending error={null} onRetry={() => undefined} pendingLabel="Signing in…" />,
  },
};
export const AccountError: Story = {
  args: {
    accountFeedback: (
      <RemoteMutationNotice
        pending={false}
        error={new Error("Sign in failed")}
        onRetry={() => undefined}
        errorLabel="Unable to sign in."
      />
    ),
  },
};
export const LongContent: Story = {
  args: {
    ...settingsFormProps,
    isLoggedIn: true,
    identity: {
      uid: "settings-user-with-an-intentionally-long-identifier-for-responsive-review-1234567890",
      displayName: "A settings user with an intentionally long display name for responsive review",
    },
    version: "2026.07.16-calm-focus-settings-presentation-long-metadata",
  },
};
export const Dark: Story = { ...LoggedIn, globals: { theme: "dark" } };
export const Mobile: Story = { ...LongContent, parameters: { viewport: { defaultViewport: "iphonex" } } };
