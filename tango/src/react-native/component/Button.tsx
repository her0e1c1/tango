import * as React from "react";
import * as NB from "native-base";

const types = [
  "danger",
  "warning",
  "success",
  "info",
  "primary",
  "light",
  "dark",
] as const;

type Unpacked<T> = T extends { [K in keyof T]: infer U } ? U : never;
type ButtonType = { [key in Unpacked<typeof types>]?: boolean };

export const Button = (
  props: {
    onPress?: Callback;
    text: string;
    full?: boolean;
    large?: boolean;
  } & ButtonType
) => {
  const { text, ...rest } = props;
  return (
    <NB.Button small={!props.full} {...rest}>
      <NB.Text>{props.text}</NB.Text>
    </NB.Button>
  );
};

export const Badge = (
  props: {
    text: string;
  } & ButtonType
) => {
  const { text, ...rest } = props;
  return (
    <NB.Button {...rest}>
      <NB.Text>{props.text}</NB.Text>
    </NB.Button>
  );
};
