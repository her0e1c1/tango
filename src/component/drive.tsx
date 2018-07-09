import * as Action from 'src/action';
import * as Selector from 'src/selector';
import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import { connect } from 'react-redux';

export class _Sheet extends React.Component<
  ConnectedProps & { driveId: number },
  { refreshing: boolean }
> {
  state = { refreshing: false };
  componentDidMount() {
    const drive = this.props.state.drive.byId[this.props.driveId];
    this.props.dispatch(Action.drive.getSheets(drive));
  }
  render() {
    const drive = this.props.state.drive.byId[this.props.driveId];
    if (!drive) {
      return <RN.View />;
    }
    const sheets = drive.sheets || [];
    return (
      <RN.FlatList
        data={sheets.filter(x => !!x).map((d, key) => ({ ...d, key }))}
        onRefresh={async () => {
          await this.setState({ refreshing: false });
        }}
        refreshing={this.state.refreshing}
        renderItem={({ item }: { item: Sheet }) => (
          <NB.ListItem
            onPress={() =>
              this.props.dispatch(
                Action.drive.importFromSpreadSheet(drive, item)
              )
            }
          >
            <NB.Title>{item.properties.title}</NB.Title>
          </NB.ListItem>
        )}
      />
    );
  }
}
export const Sheet = connect(state => ({ state }))(_Sheet);

export class _SpreadSheetList extends React.Component<
  ConnectedProps,
  { refreshing: boolean }
> {
  state = { refreshing: false };
  render() {
    const { dispatch } = this.props;
    const decks = Selector.getMyDrives(this.props.state);
    return (
      <RN.FlatList
        data={decks.filter(x => !!x).map((d, key) => ({ ...d, key }))}
        onRefresh={async () => {
          await this.props.dispatch(Action.drive.getSpreadSheets());
          await this.setState({ refreshing: false });
        }}
        refreshing={this.state.refreshing}
        renderItem={({ item }: { item: Drive }) => (
          <NB.ListItem
            onPress={() =>
              dispatch(Action.nav.goTo('sheet', { driveId: item.id }))
            }
          >
            <NB.Left>
              <NB.Title>{item.name}</NB.Title>
            </NB.Left>
            <NB.Right>
              <NB.Icon active name="arrow-forward" />
            </NB.Right>
          </NB.ListItem>
        )}
      />
    );
  }
}
export const SpreadSheetList = connect(state => ({ state }))(_SpreadSheetList);
