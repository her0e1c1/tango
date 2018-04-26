import * as Action from 'src/action';
import * as Selector from 'src/selector';
import * as React from 'react';
import * as RN from 'react-native';
import * as SD from './styled';
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
      <SD.Container>
        <RN.FlatList
          data={sheets.filter(x => !!x).map((d, key) => ({ ...d, key }))}
          onRefresh={async () => {
            await this.setState({ refreshing: false });
          }}
          refreshing={this.state.refreshing}
          renderItem={({ item }: { item: Sheet }) => (
            <RN.TouchableOpacity
              onPress={() =>
                this.props.dispatch(
                  Action.drive.importFromSpreadSheet(drive, item)
                )
              }
            >
              <SD.DeckCard style={{ marginBottom: 10 }}>
                <SD.DeckTitle>{item.properties.title}</SD.DeckTitle>
              </SD.DeckCard>
            </RN.TouchableOpacity>
          )}
        />
      </SD.Container>
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
      <SD.Container>
        <RN.FlatList
          data={decks.filter(x => !!x).map((d, key) => ({ ...d, key }))}
          onRefresh={async () => {
            await this.props.dispatch(Action.drive.getSpreadSheets());
            await this.setState({ refreshing: false });
          }}
          refreshing={this.state.refreshing}
          renderItem={({ item }: { item: Drive }) => (
            <RN.TouchableOpacity
              onPress={() =>
                dispatch(Action.nav.goTo('sheet', { driveId: item.id }))
              }
            >
              <SD.DeckCard style={{ marginBottom: 10 }}>
                <SD.DeckTitle>{item.name}</SD.DeckTitle>
              </SD.DeckCard>
            </RN.TouchableOpacity>
          )}
        />
      </SD.Container>
    );
  }
}
export const SpreadSheetList = connect(state => ({ state }))(_SpreadSheetList);
