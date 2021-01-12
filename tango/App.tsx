/// <reference path="../../../" />
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as RN from 'react-native';
import * as NB from 'native-base';
import Icon from 'react-native-vector-icons/FontAwesome';

export const TouchableOpacity = (props: {
  onPress?: () => void;
  children: any;
}) => {
  return props.onPress ? (
    <RN.TouchableOpacity onPress={props.onPress}>
      {props.children}
    </RN.TouchableOpacity>
  ) : (
      props.children
    );
};


export const Header = (props: {
  left?: { onPress?: Callback };
  body?: { title: string; onPress?: Callback };
  right?: { icon: string; onPress?: Callback };
}) => (
  <NB.Header>
    {props.left ? (
      <NB.Left>
        <NB.Button transparent onPress={props.left.onPress}>
          <NB.Icon name="arrow-back" />
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

export default function App() {
  return (
    <NB.Root>
      <Header body={{ title: "Body" }} />
      <View style={styles.container}>
        <Text>Open up App.tsx to start working on your app</Text>
        <StatusBar style="auto" />
      </View>
    </NB.Root>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
