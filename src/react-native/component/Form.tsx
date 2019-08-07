import React from 'react';
import * as NB from 'native-base';

export const Field = (props: {
  name: string;
  value: string;
  rowSpan?: number;
  onChangeText?: Callback1<string>;
}) => (
  <NB.View>
    <NB.Separator>
      <NB.Text>{props.name}</NB.Text>
    </NB.Separator>
    <NB.Textarea
      style={{ flex: 1, backgroundColor: 'white', marginBottom: 10 }}
      rowSpan={props.rowSpan || 5}
      value={props.value}
      onChangeText={props.onChangeText}
    />
  </NB.View>
);
