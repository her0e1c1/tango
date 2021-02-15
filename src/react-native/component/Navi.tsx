import * as React from "react";
import * as NB from "native-base";
import Icon from "react-native-vector-icons/FontAwesome";
import { TouchableOpacity } from "./Common";

export const Header = (props: {
  left?: { onPress?: Callback };
  body?: { title: string; onPress?: Callback };
  right?: { icon: string; onPress?: Callback };
}) => (
  <NB.Header>
    {props.left ? (
      <NB.Left>
        <NB.Button transparent onPress={props.left.onPress}>
          <Icon name="chevron-left" />
        </NB.Button>
      </NB.Left>
    ) : (
        <NB.Left />
      )}
    {props.body ? (
      <NB.Body>
        <TouchableOpacity onPress={props.body.onPress}>
          <NB.Title>{props.body.title}</NB.Title>
        </TouchableOpacity>
      </NB.Body>
    ) : (
        <NB.Body />
      )}
    {props.right ? (
      <NB.Right>
        <NB.Button transparent onPress={props.right.onPress}>
          <Icon name={props.right.icon} size={20} />
        </NB.Button>
      </NB.Right>
    ) : (
        <NB.Right />
      )}
  </NB.Header>
);
