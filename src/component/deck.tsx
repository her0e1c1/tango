import styled from 'styled-components';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Redux from 'redux';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';
import CardList from './card';
import CardView from './view';

const MainText = styled(RN.Text)`
  color: white;
  font-size: 16px;
`;

const DeckCard = styled(RN.View)`
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

@connect((state: RootState) => ({ nav: state.nav }), {
  goBack: Action.goBack,
  goHome: Action.goHome,
})
export class Header extends React.Component {
  render() {
    const { deck } = this.props.nav;
    return (
      <RN.View style={{ marginBottom: 10 }}>
        <RN.View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 5,
          }}
        >
          <MainText>TANGO FOR MEMO {deck && `(${deck.name})`}</MainText>
          {deck && (
            <RN.TouchableOpacity
              onPress={() => this.props.goBack()}
              onLongPress={() => this.props.goHome()}
            >
              <MainText>{'< BACK'}</MainText>
            </RN.TouchableOpacity>
          )}
        </RN.View>
        {!deck && <SearchBar />}
      </RN.View>
    );
  }
}

@connect((_: RootState) => ({}), { insertByURL: Action.insertByURL })
export class SearchBar extends React.Component<
  {},
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
      <RN.View style={{ flexDirection: 'row' }}>
        <RN.TextInput
          // autoFocus
          keyboardType="url"
          value={this.state.text}
          placeholder="Input your CSV url ..."
          style={{ backgroundColor: 'white', fontSize: 16, flex: 1 }}
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
        <RN.Button
          title="Q"
          color="#841584"
          onPress={() => alert('implement later :)')}
        />
      </RN.View>
    );
  }
}

@connect((state: RootState) => ({ card: state.card }), {
  deleteDeck: Action.deleteDeck,
  insertByURL: Action.insertByURL,
  goTo: Action.goTo,
})
export class DeckItem extends React.Component<
  { deck: Deck; card: CardState },
  {}
> {
  render() {
    const { deck } = this.props;
    const allCardIds = this.props.card.byDeckId[deck.id] || [];
    const mastered = allCardIds
      .map(id => this.props.card.byId[id])
      .filter(x => !!x && x.mastered);
    return (
      <Swipeout
        autoClose
        style={{ backgroundColor: 'skyblue', marginBottom: 10 }}
        right={[
          {
            text: 'DEL',
            backgroundColor: 'red',
            onPress: () => this.props.deleteDeck(deck),
          },
        ]}
        left={[
          {
            text: 'COPY',
            backgroundColor: 'blue',
            onPress: () => this.props.insertByURL(deck.url),
          },
        ]}
      >
        <RN.TouchableOpacity
          onPress={() => this.props.goTo({ deck: deck })}
          onLongPress={() => alert(JSON.stringify(deck))}
        >
          <DeckCard>
            <DeckTitle>{deck.name}</DeckTitle>
            <RN.Text>
              {mastered.length} of {allCardIds.length} cards mastered
            </RN.Text>
          </DeckCard>
        </RN.TouchableOpacity>
      </Swipeout>
    );
  }
}

@connect((state: RootState) => ({ decks: Object.values(state.deck) }), {})
export class DeckList extends React.Component<{}, {}> {
  render() {
    return (
      <RN.FlatList
        data={this.props.decks.map(d => ({ ...d, key: d.id }))}
        renderItem={({ item }) => <DeckItem deck={item} />}
      />
    );
  }
}

@connect((state: RootState) => ({ nav: state.nav }), {
  selectCard: Action.selectCard,
  selectDeck: Action.selectDeck,
})
export default class Home extends React.Component<{}, {}> {
  async componentDidMount() {
    await this.props.selectDeck();
    await this.props.selectCard();
  }
  render() {
    const { nav } = this.props;
    return (
      <Container>
        <Header />
        {nav.deck && nav.index !== undefined && <CardView />}
        {nav.deck && nav.index == undefined && <CardList />}
        {!nav.deck && <DeckList />}
      </Container>
    );
  }
}
