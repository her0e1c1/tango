/// <reference path="../../../" />
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as NB from 'native-base';

export const Header = (props: {
  left?: { onPress?: Callback };
  body?: { title: string; onPress?: Callback };
  right?: { icon: string; onPress?: Callback };
}) => (
  <NB.Header></NB.Header>
);

export default function App() {
  return (
    <NB.Root>
      <View style={styles.container}>
        <Text>Open up App.tsx to start working on your app.</Text>
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
