import React from 'react';
import * as NB from 'native-base';
import * as RN from 'react-native';
import { TouchableOpacity } from './Common';
import Icon from 'react-native-vector-icons/FontAwesome';

const getListProps = (props: {
  noBorder?: boolean;
  icon?: boolean;
  onPressItem?: Callback;
}) => {
  let { noBorder, icon, onPressItem } = props;
  if (RN.Platform.OS == 'android') {
    icon = false; // HOTFIX: can not press swich ...
  }
  return { noBorder, icon, onPressItem };
};

export const Separator = (props: { text?: string; bordered?: boolean }) => (
  <NB.Separator bordered={props.bordered}>
    {props.text && <NB.Text>{props.text}</NB.Text>}
  </NB.Separator>
);

const Item = props => {
  return (
    <NB.ListItem
      icon={props.icon}
      noBorder={props.noBorder}
      onPress={props.onPressItem}
    >
      {!!props.left && <NB.Left>{props.left}</NB.Left>}
      {!!props.body && <NB.Body>{props.body}</NB.Body>}
      {!!props.right && <NB.Right>{props.right}</NB.Right>}
    </NB.ListItem>
  );
};

export const TextItem = (props: {
  left?: string;
  body: string;
  right?: string;
  noBorder?: boolean;
  icon?: boolean;
  onPress?: () => void;
}) => (
  <Item
    {...getListProps(props)}
    left={!!props.left && <NB.Text>{props.left}</NB.Text>}
    body={!!props.body && <NB.Text>{props.body}</NB.Text>}
    right={
      !!props.right && (
        <TouchableOpacity onPress={props.onPress}>
          <NB.Text>{props.right}</NB.Text>
        </TouchableOpacity>
      )
    }
  />
);

export const ButtonItem = (props: {
  title: string;
  left?: string;
  body?: string;
  noBorder?: boolean;
  icon?: boolean;
  onPress?: () => void;
  danger?: boolean;
}) => (
  // on android, "logout" text is broken if without fontSize
  <Item
    {...getListProps(props)}
    left={props.left && <NB.Text>{props.left}</NB.Text>}
    body={props.body && <NB.Text>{props.body}</NB.Text>}
    right={
      <NB.Button onPress={props.onPress} small danger={props.danger}>
        <NB.Text style={{ fontSize: 12 }}>{props.title}</NB.Text>
      </NB.Button>
    }
  />
);

export const InputItem = (props: {
  value: string;
  left?: string;
  noBorder?: boolean;
  icon?: boolean;
  onChangeText?: Callback1<string>;
}) => (
  <Item
    {...getListProps(props)}
    left={props.left && <NB.Text>{props.left}</NB.Text>}
    body={
      <NB.Input
        style={{ backgroundColor: 'white' }}
        value={props.value}
        onChangeText={props.onChangeText}
      />
    }
  />
);

export const IconItem = (props: {
  name: string;
  left?: string;
  body?: string;
  noBorder?: boolean;
  icon?: boolean;
  size?: number;
  onPress?: Callback;
  onPressItem?: Callback;
  awsomeFont?: boolean;
}) => (
  <Item
    {...getListProps(props)}
    left={props.left && <NB.Text>{props.left}</NB.Text>}
    body={props.body && <NB.Text>{props.body}</NB.Text>}
    right={
      <NB.Button onPress={props.onPress} transparent>
        {props.awsomeFont ? (
          <Icon name={props.name} size={props.size || 25} />
        ) : (
          <NB.Icon name={props.name} />
        )}
      </NB.Button>
    }
  />
);

export const CardItem = (props: {
  name: string;
  score: number;
  gray?: boolean;
  left?: string;
  body?: string;
  size?: number;
  onPress?: Callback;
  onPressItem?: Callback;
}) => (
  <NB.View style={{ backgroundColor: props.gray ? '#bcbcbc' : undefined }}>
    <NB.ListItem
      onPress={props.onPressItem}
      style={{ backgroundColor: props.gray ? '#bcbcbc' : undefined }}
    >
      <NB.Body style={{ flex: 1, flexDirection: 'row' }}>
        <NB.Badge
          primary={!props.score} // including undefined or null
          warning={props.score < 0}
          success={props.score > 0}
        >
          <NB.Text>{props.score || 0}</NB.Text>
        </NB.Badge>
        <NB.Text>{props.body}</NB.Text>
      </NB.Body>
      <NB.Right>
        <NB.Button onPress={props.onPress} transparent>
          <Icon name={props.name} size={props.size || 25} />
        </NB.Button>
      </NB.Right>
    </NB.ListItem>
  </NB.View>
);

export const SwithItem = (props: {
  left?: string;
  body?: string;
  value: boolean;
  noBorder?: boolean;
  icon?: boolean;
  onValueChange?: (arg: boolean) => void;
}) => (
  <Item
    {...getListProps(props)}
    left={props.left && <NB.Text>{props.left}</NB.Text>}
    body={props.body && <NB.Text>{props.body}</NB.Text>}
    right={
      <NB.Right>
        <RN.Switch value={props.value} onValueChange={props.onValueChange} />
      </NB.Right>
    }
  />
);

export const RadioItem = (props: {
  left?: string;
  body?: string;
  selected: boolean;
  noBorder?: boolean;
  icon?: boolean;
  onPress?: Callback;
  onPressItem?: Callback;
}) => (
  <Item
    {...getListProps(props)}
    left={props.left && <NB.Text>{props.left}</NB.Text>}
    body={props.body && <NB.Text>{props.body}</NB.Text>}
    right={
      <NB.Right>
        <NB.Radio selected={props.selected} onPress={props.onPress} />
      </NB.Right>
    }
  />
);

export const PickerItem = (props: {
  left?: string;
  label?: string;
  value: string;
  empty?: boolean;
  options: string[];
  noBorder?: boolean;
  icon?: boolean;
  onValueChange?: (arg: string) => void;
}) => {
  let options = props.options;
  if (props.empty) options = [''].concat(props.options);
  return (
    <Item
      {...getListProps(props)}
      left={props.label && <NB.Text>{props.label}</NB.Text>}
      body={
        <NB.Picker
          textStyle={{ color: 'cornflowerblue' }}
          selectedValue={props.value || ''}
          onValueChange={props.onValueChange}
          iosIcon={<NB.Icon name="arrow-down" />} // "ios-arrow-down-outline"
        >
          {options.map(x => (
            <NB.Picker.Item key={x} label={x} value={x} />
          ))}
        </NB.Picker>
      }
    />
  );
};

export const SliderItem = (props: {
  left?: string;
  body?: string;
  min?: number;
  max?: number;
  value: number;
  noBorder?: boolean;
  icon?: boolean;
  disabled?: boolean;
  onValueChange?: Callback1<number>;
  onSlidingComplete?: Callback1<number>;
}) => (
  <NB.ListItem {...getListProps(props)}>
    <RN.Slider
      disabled={props.disabled}
      step={1}
      value={props.value}
      minimumValue={props.min || 0}
      maximumValue={props.max || 100}
      onValueChange={props.onValueChange}
      onSlidingComplete={props.onSlidingComplete}
      style={{ flex: 1 }}
    />
  </NB.ListItem>
);

export const SwipeRow = (props: {
  title: string;
  onPress?: Callback;
  onLongPress?: Callback;
  onLeftPress?: Callback;
  rightIcon?: string;
  onRightPress?: Callback;
}) => {
  return (
    <NB.SwipeRow
      leftOpenValue={props.onLeftPress && 50}
      rightOpenValue={props.onRightPress && -50}
      swipeToOpenPercent={30}
      directionalDistanceChangeThreshold={2}
      left={
        props.onLeftPress && (
          <NB.Button primary onPress={props.onLeftPress}>
            <NB.Icon active name="list" />
          </NB.Button>
        )
      }
      right={
        props.onRightPress && (
          <NB.Button danger onPress={props.onRightPress}>
            <NB.Icon name={props.rightIcon || 'list'} />
          </NB.Button>
        )
      }
      /* NB.Title shows nothing in android */
      body={
        <RN.TouchableOpacity
          style={{ flex: 1 }}
          onPress={props.onPress}
          onLongPress={props.onLongPress}
        >
          <NB.View
            style={{
              flex: 1,
              paddingLeft: 20 /* cuz of paddingRight already :(*/,
            }}
          >
            <NB.H2>{props.title}</NB.H2>
          </NB.View>
        </RN.TouchableOpacity>
      }
    />
  );
};
