import * as _ from 'lodash';
import * as React from 'react';
import * as RN from 'react-native';
import * as Swiper from 'react-native-swiper';
import { connect } from 'react-redux';
import GestureRecognizer from 'react-native-swipe-gestures';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';

interface Item {
  name: string;
  body: string;
}

export const ListItem = connect((_: RootState) => ({}), {
  deleteCard: Action.deleteCard,
})((props: { item: Item; onPress: (n: number) => void }) => (
  <Swipeout
    autoClose
    left={[
      {
        text: 'DEL',
        backgroundColor: 'red',
        onPress: () => props.deleteCard(props.item),
      },
    ]}
  >
    <RN.TouchableOpacity onPress={() => props.onPress()}>
      <RN.View style={{ backgroundColor: '#555', borderWidth: 1 }}>
        <RN.Text style={{ fontSize: 20 }}>{props.item.name}</RN.Text>
      </RN.View>
    </RN.TouchableOpacity>
  </Swipeout>
));

export const Detail = (props: { item: Item }) => (
  <RN.View>
    <RN.Text style={{ fontSize: 10 }}>{props.item && props.item.name}</RN.Text>
    <RN.Text style={{ fontSize: 20 }}>{props.item && props.item.body}</RN.Text>
  </RN.View>
);

type State = { loading: boolean; text: string; index: number };
@connect((_: RootState) => ({ state: Action.getAll(state) }), {
  insert: Action.insert,
  selectAll: Action.select,
})
export class Home extends React.Component<{}, State> {
  static navigationOptions = {
    header: null,
    tabBarVisible: false,
  };
  constructor(props) {
    super(props);
    this.state = {
      index: 0,
      text: '',
      loading: false,
    };
  }
  render() {
    const items = this.props.state;
    return (
      <Swiper
        ref={s => (this.swiper = s)}
        loop={false}
        showsButtons={false}
        showsPagination={false}
        horizontal={true}
        nextButton={<RN.Text>&gt;</RN.Text>}
        prevButton={<RN.Text>&lt;</RN.Text>}
      >
        <RN.View>
          <SearchURL />
          <RN.ScrollView>
            {items.map((x, i) => (
              <ListItem
                key={i}
                item={x}
                onPress={() => {
                  this.setState({ index: i });
                  this.swiper.scrollBy(1, true);
                }}
              />
            ))}
          </RN.ScrollView>
        </RN.View>
        <GestureRecognizer
          style={{
            flex: 1,
            backgroundColor: '#ddd',
            alignSelf: 'stretch',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onSwipeUp={() => this.setState({ index: this.state.index - 1 })}
          onSwipeDown={() => this.setState({ index: this.state.index + 1 })}
        >
          <Detail item={items[this.state.index]} />
        </GestureRecognizer>
      </Swiper>
    );
  }
}
