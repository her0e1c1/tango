import type * as React from "react";

import { Button, Form, FormItem, Input, Section, Slider, Switch } from "@/shared/components";

export interface ConfigFormFields {
  showHeader: React.ComponentProps<typeof Switch>;
  showSwipeButtonList: React.ComponentProps<typeof Switch>;
  showSwipeFeedback: React.ComponentProps<typeof Switch>;
  darkMode: React.ComponentProps<typeof Switch>;
  localMode: React.ComponentProps<typeof Switch>;
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
  return (
    <Form div>
      <Section title="Settings" />
      <FormItem label={props.isLoggedIn ? `Logged In As ${props.identity?.displayName ?? "no name"}` : "Google Login"}>
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
      <Section title="Layout" />
      <FormItem label="Show Heaer">
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
      <FormItem label="Local Mode">
        <Switch {...props.fields.localMode} />
      </FormItem>
      <Section title="Card" />
      <FormItem label="Shuffle Cards">
        <Switch {...props.fields.shuffled} />
      </FormItem>
      <FormItem label="Use Card Interval">
        <Switch {...props.fields.useCardInterval} />
      </FormItem>
      <FormItem col label="Max Number" extra={`Max number of cards to learn: ${props.maxNumberOfCardsToLearn}`}>
        <Slider {...props.fields.maxNumberOfCardsToLearn} />
      </FormItem>
      <Section title="Auto Play" />
      <FormItem label="Auto Play Start">
        <Switch {...props.fields.defaultAutoPlay} />
      </FormItem>
      <FormItem col label={`Interval: ${props.cardInterval} sec`}>
        <Slider {...props.fields.cardInterval} />
      </FormItem>
      <Section title="Meta" />
      <FormItem label="Version">{props.version}</FormItem>
      <FormItem col label="Github Access Token">
        <Input {...props.fields.githubAccessToken} />
      </FormItem>
      <FormItem label="User Id">{props.identity?.uid ?? ""}</FormItem>
    </Form>
  );
};
