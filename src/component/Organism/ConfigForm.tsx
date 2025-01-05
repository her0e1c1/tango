import * as React from "react";

import { Switch, Button, Slider, Section, Input } from "../Atom";
import { Form, FormItem } from "../Molecule";
import { useForm } from "react-hook-form";
import { renameKey } from "./form";

export const ConfigForm: React.FC<ConfigFormProps> = (props) => {
  const { watch, register, handleSubmit, setValue } = useForm<ConfigState>({
    defaultValues: props.config,
  });

  const onSubmit = props.onSubmit;
  React.useEffect(() => {
    const subscription = watch(() => {
      void handleSubmit((data) => {
        onSubmit?.(data);
      })();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [handleSubmit, watch, onSubmit]);

  const darkMode = props.config.darkMode;
  React.useEffect(() => {
    setValue("darkMode", darkMode);
  }, [setValue, darkMode]);

  return (
    <Form div>
      <Section title="Settings" />
      <FormItem label={props.isLoggedIn ? `Logged In As ${props.config.displayName ?? "no name"}` : "Google Login"}>
        {props.isLoggedIn ? (
          <Button small onClick={props.onLogout}>
            Logout
          </Button>
        ) : (
          <Button primary small onClick={props.onLogin}>
            Login
          </Button>
        )}
      </FormItem>
      <Section title="Layout" />
      <FormItem label="Show Heaer">
        <Switch {...renameKey(register("showHeader"))} />
      </FormItem>
      <FormItem label="Show Button List">
        <Switch {...renameKey(register("showSwipeButtonList"))} />
      </FormItem>
      <FormItem label="Show Swipe Feedback">
        <Switch {...renameKey(register("showSwipeFeedback"))} />
      </FormItem>
      <FormItem label="Dark Mord">
        <Switch {...renameKey(register("darkMode"))} />
      </FormItem>
      <Section title="Card" />
      <FormItem label="Shuffle Cards">
        <Switch {...renameKey(register("shuffled"))} />
      </FormItem>
      <FormItem label="Use Card Interval">
        <Switch {...renameKey(register("useCardInterval"))} />
      </FormItem>
      <FormItem col label="Max Number" extra={`Max number of cards to learn: ${watch("maxNumberOfCardsToLearn")}`}>
        <Slider {...renameKey(register("maxNumberOfCardsToLearn", { valueAsNumber: true }))} min={0} max={100} />
      </FormItem>
      <Section title="Auto Play" />
      <FormItem label="Auto Play Start">
        <Switch {...renameKey(register("defaultAutoPlay"))} />
      </FormItem>
      <FormItem col label={`Interval: ${watch("cardInterval")} sec`}>
        <Slider {...renameKey(register("cardInterval", { valueAsNumber: true }))} min={0} max={60} />
      </FormItem>
      <Section title="Meta" />
      <FormItem label="Version">{props.version}</FormItem>
      <FormItem col label="Github Access Token">
        <Input {...renameKey(register("githubAccessToken"))} />
      </FormItem>
      <FormItem label="User Id">{props.config.uid}</FormItem>
      <FormItem label="Last Updated">
        {props.config.lastUpdatedAt ? new Date(props.config.lastUpdatedAt).toLocaleString() : ""}
      </FormItem>
    </Form>
  );
};
