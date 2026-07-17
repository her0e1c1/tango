import type * as React from "react";
import { useId } from "react";

import { Button, Form, FormItem, Input, Slider, Switch } from "@/shared/components";

export interface ConfigFormFields {
  showHeader: React.ComponentProps<typeof Switch>;
  showSwipeButtonList: React.ComponentProps<typeof Switch>;
  showSwipeFeedback: React.ComponentProps<typeof Switch>;
  darkMode: React.ComponentProps<typeof Switch>;
  shuffled: React.ComponentProps<typeof Switch>;
  useCardInterval: React.ComponentProps<typeof Switch>;
  maxNumberOfCardsToLearn: React.ComponentProps<typeof Slider>;
  defaultAutoPlay: React.ComponentProps<typeof Switch>;
  cardInterval: React.ComponentProps<typeof Slider>;
  githubAccessToken: React.ComponentProps<typeof Input>;
}

export interface ConfigFormProps {
  isLoggedIn?: boolean;
  identity?: { uid: string; displayName: string | null };
  config: ConfigState;
  fields: ConfigFormFields;
  maxNumberOfCardsToLearn: number;
  cardInterval: number;
  onLogin?: () => void;
  onLogout?: () => void;
  version?: string;
}

export const ConfigForm: React.FC<ConfigFormProps> = (props) => {
  const sectionHeadingIdPrefix = useId();
  const accountHeadingId = `${sectionHeadingIdPrefix}-settings-account-heading`;
  const layoutHeadingId = `${sectionHeadingIdPrefix}-settings-layout-heading`;
  const studyHeadingId = `${sectionHeadingIdPrefix}-settings-study-heading`;
  const autoplayHeadingId = `${sectionHeadingIdPrefix}-settings-autoplay-heading`;
  const metadataHeadingId = `${sectionHeadingIdPrefix}-settings-metadata-heading`;

  return (
    <Form div>
      <section
        aria-labelledby={accountHeadingId}
        className="space-y-4 rounded-surface border border-border bg-surface-muted p-4"
      >
        <h2 id={accountHeadingId} className="text-title font-semibold text-ink">
          Account
        </h2>
        <FormItem
          label={props.isLoggedIn ? `Logged In As ${props.identity?.displayName ?? "no name"}` : "Google Login"}
        >
          {props.isLoggedIn ? (
            <Button small {...(props.onLogout !== undefined ? { onClick: props.onLogout } : {})}>
              Logout
            </Button>
          ) : (
            <Button primary small {...(props.onLogin !== undefined ? { onClick: props.onLogin } : {})}>
              Login
            </Button>
          )}
        </FormItem>
      </section>
      <section aria-labelledby={layoutHeadingId} className="space-y-4">
        <h2 id={layoutHeadingId} className="border-b border-border pb-2 text-title font-semibold text-ink">
          Layout
        </h2>
        <FormItem label="Show Header">
          <Switch {...props.fields.showHeader} />
        </FormItem>
        <FormItem label="Show Button List">
          <Switch {...props.fields.showSwipeButtonList} />
        </FormItem>
        <FormItem label="Show Swipe Feedback">
          <Switch {...props.fields.showSwipeFeedback} />
        </FormItem>
        <FormItem label="Dark Mode">
          <Switch {...props.fields.darkMode} />
        </FormItem>
      </section>
      <section aria-labelledby={studyHeadingId} className="space-y-4">
        <h2 id={studyHeadingId} className="border-b border-border pb-2 text-title font-semibold text-ink">
          Study
        </h2>
        <FormItem label="Shuffle Cards">
          <Switch {...props.fields.shuffled} />
        </FormItem>
        <FormItem label="Use Card Interval">
          <Switch {...props.fields.useCardInterval} />
        </FormItem>
        <FormItem col label="Max Number" extra={`Max number of cards to learn: ${props.maxNumberOfCardsToLearn}`}>
          <Slider {...props.fields.maxNumberOfCardsToLearn} />
        </FormItem>
      </section>
      <section aria-labelledby={autoplayHeadingId} className="space-y-4">
        <h2 id={autoplayHeadingId} className="border-b border-border pb-2 text-title font-semibold text-ink">
          Autoplay
        </h2>
        <FormItem label="Auto Play Start">
          <Switch {...props.fields.defaultAutoPlay} />
        </FormItem>
        <FormItem col label={`Interval: ${props.cardInterval} sec`}>
          <Slider {...props.fields.cardInterval} />
        </FormItem>
      </section>
      <section aria-labelledby={metadataHeadingId} className="space-y-4">
        <h2 id={metadataHeadingId} className="border-b border-border pb-2 text-title font-semibold text-ink">
          Metadata
        </h2>
        <FormItem label="Version">{props.version}</FormItem>
        <FormItem col label="Github Access Token">
          <Input {...props.fields.githubAccessToken} />
        </FormItem>
        <FormItem label="User Id">{props.identity?.uid ?? ""}</FormItem>
      </section>
    </Form>
  );
};
