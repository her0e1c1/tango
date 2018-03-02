import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as SD from './styled';
import { withNavigation } from 'react-navigation';

@withNavigation
export class _Header extends React.Component<ConnectedProps, {}> {
  render() {
    const { state, dispatch } = this.props;
    if (!state.config.showHeader) {
      return <RN.View />;
    }
    const showBackButton = this.props.state.nav.routes.length > 1;
    const showPlusButton = ['deck', 'card'].includes(
      this.props.navigation.state.routeName
    );
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
