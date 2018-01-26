import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Redux from 'redux';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';
import Card from './card';
import styled from 'styled-components';

const MainText = styled(RN.Text)`
  color: white;
  font-size: 16px;
`;

const Container = styled(RN.View)`
  flex: 1;
  background-color: skyblue;
  padding-top: 20; /* space for ios status bar */
  padding-horizontal: 20px;
`;

const Header = ({ showSearchBar, onOpen, onClose }) => (
  <RN.View
    style={{
      flex: 1,
    }}
  >
    {showSearchBar ? (
      <SearchURL onClose={onClose} />
    ) : (
      <RN.View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <MainText>TANGO FOR MEMO</MainText>
        <RN.TouchableWithoutFeedback onPress={onOpen}>
          <MainText>+ Import</MainText>
        </RN.TouchableWithoutFeedback>
      </RN.View>
    )}
  </RN.View>
);

@connect((_: RootState) => ({}), { insertByURL: Action.insertByURL })
export class SearchURL extends React.Component<
  any,
  { text: string; loading: boolean }
> {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      loading: false,
    };
  }
  render() {
    return (
      <RN.View style={{ flex: 1 }}>
        <RN.TextInput
          autoFocus
          keyboardType="url"
          value={this.state.text}
          placeholder="https:// ... (CSV URL)"
          style={{ backgroundColor: 'white', fontSize: 16 }}
          onChangeText={text => this.setState({ text })}
          onEndEditing={() => {
            this.props.onClose();
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
export default class Deck extends React.Component<{}, {selectedDeck?: Deck}> {
  constructor(props) {
    super(props);
    this.state = {
      showSearchBar: false,
    };
  }
  async componentDidMount() {
    await this.props.selectDeck();
    await this.props.selectCard();
  }
  render() {
    return (
      <Container style={{ justifyContent: 'flex-start' }}>
        <Header
          showSearchBar={this.state.showSearchBar}
          onOpen={() => this.setState({ showSearchBar: true })}
          onClose={() => this.setState({ showSearchBar: false })}
        />
        {this.state.selectedDeck && <Card deck={this.state.selectedDeck} onClose={() => this.setState({ selectedDeck: null }} />}
        <RN.FlatList
          style={{ flex: 1, backgroundColor: '#878' }}
          data={this.props.decks.map(d => ({ ...d, key: d.id }))}
          renderItem={({ item }) => (
            <Swipeout
              style={{ flex: 1, backgroundColor: '#909' }}
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
                style={{ flex: 1, backgroundColor: '#444' }}
                onPress={() => this.setState({ selectedDeck: item })}
                onLongPress={() => alert(JSON.stringify(item))}
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
      </Container>
    );
  }
}
