import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as SD from './styled';

const ShowBackButton = (state: RootState): boolean => {
  const i = state.nav.index;
  const r = state.nav.routes;
  return !!r && r[i].index >= 1;
};

const ShowPlusButton = (state: RootState): boolean => {
  const i = state.nav.index;
  const r = state.nav.routes;
  if (r) {
    const i2 = r[i].index;
    const r2 = r[i].routes;
    if (r2) {
      return ['deck', 'card'].includes(r2[i2].routeName);
    }
  }
  return false;
};

export class _Header extends React.Component<ConnectedProps, {}> {
  render() {
    const { state, dispatch } = this.props;
    if (!state.config.showHeader) {
      return <RN.View />;
    }
    const showBackButton = ShowBackButton(this.props.state);
    const showPlusButton = ShowPlusButton(this.props.state);
    const card = Action.getCurrentCard(state);
    const deck = Action.getCurrentDeck(state);
    return (
      <RN.View style={{ marginBottom: 10 }}>
        <RN.View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 5,
          }}
        >
          {showBackButton && (
            <RN.TouchableOpacity
              onPress={() => dispatch(Action.nav.goBack())}
              onLongPress={() => dispatch(Action.nav.goHome())}
            >
              <SD.MainText>{'<'}</SD.MainText>
            </RN.TouchableOpacity>
          )}
          <RN.View style={{ flexDirection: 'row' }}>
            <SD.MainText>{deck && deck.name && `${deck.name}`}</SD.MainText>
            {card &&
              card.category != null && (
                <SD.CardCategory>{card.category}</SD.CardCategory>
              )}
          </RN.View>
          {showPlusButton ? (
            <RN.TouchableOpacity
              onPress={() =>
                dispatch(Action.nav.goTo('cardNew', { deck_id: deck.id }))
              }
            >
              <SD.MainText>{'+'}</SD.MainText>
            </RN.TouchableOpacity>
          ) : (
            <RN.View />
          )}
        </RN.View>
      </RN.View>
    );
  }
}
export const Header = connect(state => ({ state }))(_Header);
