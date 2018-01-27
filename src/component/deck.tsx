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

const DeckCard = styled(RN.View)`
  flex: 1;
  align-self: stretch;
  padding: 20px;
  background-color: white;
  border-style: solid;
  border-width: 0px;
`;

const DeckTitle = styled(RN.Text)`
  color: black;
  font-weight: bold;
  font-size: 20px;
`;

const Container = styled(RN.View)`
  flex: 1;
  background-color: skyblue;
  padding-top: 20; /* space for ios status bar */
  padding-horizontal: 10px;
`;

const Header = ({ showSearchBar, onOpen, onClose }) => (
  <RN.View style={{ marginBottom: 10 }}>
    {showSearchBar ? (
      <SearchURL onClose={onClose} />
    ) : (
      <RN.View
        style={{
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
    );
  }
}

@connect((state: RootState) => ({ decks: Object.values(state.deck) }), {
  selectCard: Action.selectCard,
  selectDeck: Action.selectDeck,
  deleteDeck: Action.deleteDeck,
  insertByURL: Action.insertByURL,
})
export default class Deck extends React.Component<
  {},
  { selectedDeck?: Deck; showSearchBar: boolean }
> {
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
      <Container>
        <Header
          showSearchBar={this.state.showSearchBar}
          onOpen={() => this.setState({ showSearchBar: true })}
          onClose={() => this.setState({ showSearchBar: false })}
        />
        {this.state.selectedDeck && (
          <Card
            deck={this.state.selectedDeck}
            onClose={() => this.setState({ selectedDeck: null })}
          />
        )}
        <RN.FlatList
          data={this.props.decks.map(d => ({ ...d, key: d.id }))}
          renderItem={({ item }) => (
            <Swipeout
              autoClose
              style={{ backgroundColor: 'skyblue', marginBottom: 10 }}
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
                onPress={() => this.setState({ selectedDeck: item })}
                onLongPress={() => alert(JSON.stringify(item))}
              >
                <DeckCard>
                  <DeckTitle>{item.name}</DeckTitle>
                  <RN.Text>x of y cards mastered</RN.Text>
                </DeckCard>
              </RN.TouchableOpacity>
            </Swipeout>
          )}
        />
      </Container>
    );
  }
}
