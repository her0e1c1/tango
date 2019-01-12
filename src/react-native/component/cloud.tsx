import * as React from 'react';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import { StackNavigator } from 'react-navigation';
import * as RN from 'react-native';

import * as Action from 'src/react-native/action';
import { Header } from './header';
import { InputUrl } from './inputUrl';
import { getSelector } from 'src/selector';

class _PublicDeckList extends React.Component<
  ConnectedProps,
  { refreshing: boolean }
> {
  state = { refreshing: false };
  componentDidMount() {
    this.props.dispatch(Action.deckFetch({ isPublic: true }));
  }
  render() {
    const decks = getSelector(this.props.state).deck.public;
    return (
      <RN.FlatList
        data={decks.map(d => ({ ...d, key: String(d.id) }))}
        onRefresh={async () => {
          await this.props.dispatch(Action.deckFetch({ isPublic: true }));
          await this.setState({ refreshing: false });
        }}
        refreshing={this.state.refreshing}
        ListFooterComponent={() => <RN.View style={{ marginVertical: 50 }} />}
        renderItem={({ item }: { item: Deck }) => (
          <RN.TouchableOpacity
            onPress={() =>
              this.props.dispatch(
                Action.goTo('shareCards', {
                  deck_id: item.id,
                })
              )
            }
          >
            <NB.ListItem>
              <NB.Left>
                <NB.Title>{item.name}</NB.Title>
              </NB.Left>
              <NB.Right>
                <NB.Icon
                  name="md-add"
                  onPress={() =>
                    this.props.dispatch(Action.deckImportPublic(item.id))
                  }
                />
              </NB.Right>
            </NB.ListItem>
          </RN.TouchableOpacity>
        )}
      />
    );
  }
}

const PublicDeckList = connect(state => ({ state }))(_PublicDeckList);

class _SpreadSheetList extends React.Component<
  ConnectedProps,
  { refreshing: boolean }
> {
  state = { refreshing: false };
  componentDidMount() {
    this.props.dispatch(Action.sheetFetch());
  }
  render() {
    const sheets = getSelector(this.props.state).sheet.all();
    return (
      <RN.FlatList
        data={sheets.map(d => ({ ...d, key: String(d.id) }))}
        onRefresh={async () => {
          await this.setState({ refreshing: false });
        }}
        refreshing={this.state.refreshing}
        ListFooterComponent={() => <RN.View style={{ marginVertical: 50 }} />}
        renderItem={({ item }: { item: Sheet }) => (
          <RN.TouchableOpacity>
            <NB.ListItem>
              <NB.Left>
                <NB.Title>{`${item.title} (${item.name})`}</NB.Title>
              </NB.Left>
              <NB.Right>
                <NB.Icon
                  name="md-add"
                  onPress={() =>
                    this.props.dispatch(Action.sheetImoprt(item.id))
                  }
                />
              </NB.Right>
            </NB.ListItem>
          </RN.TouchableOpacity>
        )}
      />
    );
  }
}

const SpreadSheetList = connect(state => ({ state }))(_SpreadSheetList);

const _List = props => (
  <NB.List>
    <NB.ListItem onPress={() => props.dispatch(Action.goTo('publicDeckList'))}>
      <NB.Left>
        <NB.Title>Public Deck List</NB.Title>
      </NB.Left>
      <NB.Right>
        <NB.Icon active name="arrow-forward" />
      </NB.Right>
    </NB.ListItem>
    <NB.ListItem onPress={() => props.dispatch(Action.goTo('inputUrl'))}>
      <NB.Left>
        <NB.Title>Input CSV URL (by QR code)</NB.Title>
      </NB.Left>
      <NB.Right>
        <NB.Icon active name="arrow-forward" />
      </NB.Right>
    </NB.ListItem>
    <NB.ListItem onPress={() => props.dispatch(Action.goTo('spreadSheetList'))}>
      <NB.Left>
        <NB.Title>Import From Google Spread Sheet</NB.Title>
      </NB.Left>
      <NB.Right>
        <NB.Icon active name="arrow-forward" />
      </NB.Right>
    </NB.ListItem>
  </NB.List>
);

const List = connect(state => ({ state }))(_List);

const wrap = C => props => (
  <NB.Container>
    <Header />
    <NB.Content>
      <C {...props.navigation.state.params} />
    </NB.Content>
  </NB.Container>
);

export const Root = StackNavigator(
  {
    share: { screen: wrap(List) },
    inputUrl: { screen: InputUrl },
    publicDeckList: { screen: wrap(PublicDeckList) },
    spreadSheetList: { screen: wrap(SpreadSheetList) },
  } as any,
  {
    initialRouteName: 'share',
    navigationOptions: { header: null },
  }
);

export default Root;
