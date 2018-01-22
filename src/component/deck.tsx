import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Redux from 'redux';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';
import Card from './card';

const LoadingIcon = () => (
  <RN.Modal transparent>
    <RN.View
      style={{
        flex: 1,
        backgroundColor: 'rgba(#333a)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <RN.ActivityIndicator size="large" animating={true} />
    </RN.View>
  </RN.Modal>
);
@connect((_: RootState) => ({}), { insertByURL: Action.insertByURL })
export class SearchURL extends React.Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      loading: false,
    };
  }
  render() {
    return (
      <RN.View>
        <RN.TextInput
          value={this.state.text}
          style={{ backgroundColor: '#999', fontSize: 40 }}
          onChangeText={text => this.setState({ text })}
          onEndEditing={() => {
            if (this.state.text.match(/^https?:\/\//)) {
              this.setState({ loading: true }, async () => {
                try {
                  await this.props.insertByURL(this.state.text);
                } catch {
                  alert('CAN NOT FETCH :(');
                } finally {
                  this.setState({ loading: false });
                }
              });
            } else if (this.state.text !== '') {
              alert('INVALID URL: ' + this.state.text);
            }
          }}
        />
      </RN.View>
    );
  }
}

@connect((state: RootState) => ({ decks: Object.values(state.deck) }), {
  selectCard: Action.selectCard,
  selectDeck: Action.selectDeck,
  deleteDeck: Action.deleteDeck,
  insertByURL: Action.insertByURL,
})
export default class Deck extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      item: null,
    };
  }
  componentDidMount() {
    this.props.selectDeck();
    this.props.selectCard();
  }
  render() {
    return (
      <RN.View
        style={{
          flex: 1,
          alignItems: 'stretch',
          justifyContent: 'center',
          backgroundColor: 'green',
        }}
      >
        <RN.Button title="debug" onPress={() => this.props.selectDeck()} />
        <SearchURL />
        <RN.Modal
          visible={this.state.item !== null}
          onRequestClose={() => false}
        >
          <RN.Button
            title="CLOSE"
            onPress={() => this.setState({ item: null })}
          />
          <Card deck={this.state.item} />
        </RN.Modal>
        <RN.FlatList
          data={this.props.decks.map(d => ({ ...d, key: d.id }))}
          renderItem={({ item }) => (
            <Swipeout
              autoClose
              right={[
                {
                  text: 'DEL',
                  backgroundColor: 'red',
                  onPress: () => this.props.deleteDeck(item),
                },
              ]}
              left={[
                {
                  text: 'COPY',
                  backgroundColor: 'blue',
                  onPress: () => this.props.insertByURL(item.url),
                },
              ]}
            >
              <RN.TouchableOpacity
                onPress={() => this.setState({ item })}
                onLongPress={() => alert(item.url)}
              >
                <RN.View
                  style={{
                    backgroundColor: '#fff',
                    borderStyle: 'solid',
                    borderWidth: 1,
                    alignItems: 'center',
                  }}
                >
                  <RN.Text style={{ fontSize: 20 }}>{`${item.name}(${
                    item.id
                  })`}</RN.Text>
                </RN.View>
              </RN.TouchableOpacity>
            </Swipeout>
          )}
        />
      </RN.View>
    );
  }
}
