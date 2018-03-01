import * as Action from 'src/action';
import * as Selector from 'src/selector';
import * as React from 'react';
import * as RN from 'react-native';
import * as SD from './styled';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';

@withNavigation
export class _DriveList extends React.Component<
  ConnectedProps,
  { refreshing: boolean }
> {
  state = { refreshing: false };
  render() {
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
                this.props.dispatch(Action.drive.importFromSpreadSheet(item))
              }
            >
              <SD.DeckCard style={{ marginBottom: 10 }}>
                <SD.DeckTitle>{item.title}</SD.DeckTitle>
              </SD.DeckCard>
            </RN.TouchableOpacity>
          )}
        />
      </SD.Container>
    );
  }
}
export const DriveList = connect(state => ({ state }))(_DriveList);
