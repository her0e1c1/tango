import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as SD from './styled';
import * as Selector from 'src/selector';

const ShowBackButton = (state: RootState): boolean => {
  const i = state.nav.index;
  const r = state.nav.routes;
  return !!r && r[i].index >= 1;
};

type Props = Pick<ConnectedProps, 'dispatch' | 'state'>;
export class LeftButton extends React.Component<Props, {}> {
  render() {
    const { dispatch } = this.props;
    const showBackButton = ShowBackButton(this.props.state);
    return !showBackButton ? (
      <RN.View />
    ) : (
      <RN.TouchableOpacity
        onPress={() => dispatch(Action.nav.goBack())}
        onLongPress={() => dispatch(Action.nav.goHome())}
      >
        <SD.MainText style={{ fontSize: 24 }}>{'<'}</SD.MainText>
      </RN.TouchableOpacity>
    );
  }
}

export class RightButton extends React.Component<Props, {}> {
  render() {
    const { dispatch } = this.props;
    const card = Selector.getCurrentCard(this.props.state);
    const page = Selector.getCurrentPage(this.props.state);
    let showPlusButton = false;
    if (page) {
      showPlusButton = ['deck', 'card'].includes(page.routeName);
    }
    return !showPlusButton ? (
      <RN.View />
    ) : (
      <RN.TouchableOpacity
        onPress={() =>
          dispatch(
            Action.nav.goTo('cardEdit', {
              deck_id: card.deck_id,
              card_id: card.id,
            })
          )
        }
      >
        <SD.MainText style={{ fontSize: 24 }}>{'+'}</SD.MainText>
      </RN.TouchableOpacity>
    );
  }
}

export class _Header extends React.Component<ConnectedProps, {}> {
  render() {
    const { state, dispatch } = this.props;
    if (!state.config.showHeader) {
      return <RN.View />;
    }
    const deck = Selector.getCurrentDeck(state);
    return (
      <RN.View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 0,
        }}
      >
        <LeftButton state={state} dispatch={dispatch} />
        <RN.View style={{ flexDirection: 'row' }}>
          <SD.MainText>{deck && deck.name && `${deck.name}`}</SD.MainText>
        </RN.View>
        <RightButton state={state} dispatch={dispatch} />
      </RN.View>
    );
  }
}
export const Header = connect(state => ({ state }))(_Header);
