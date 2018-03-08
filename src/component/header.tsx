import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as SD from './styled';
import * as Selector from 'src/selector';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  getIcon(name: string) {
    if (name === 'cardEdit') {
      return <SD.MainText style={{ fontSize: 20 }}>{'DONE'}</SD.MainText>;
    } else if (name === 'card') {
      return <Ionicons name="ios-create" size={24} />;
    } else if (['deck', 'card'].includes(name)) {
      return <SD.MainText style={{ fontSize: 24 }}>{'+'}</SD.MainText>;
    } else {
      return <RN.View />;
    }
  }
  async doAction(name: string) {
    const { dispatch } = this.props;
    if (name === 'cardEdit') {
      await dispatch(Action.card.updateCard(this.props.state.card.edit));
      await dispatch(Action.nav.goBack());
    } else {
      const card = Selector.getCurrentCard(this.props.state);
      await dispatch(
        Action.nav.goTo('cardEdit', {
          deck_id: card.deck_id,
          card_id: card.id,
        })
      );
    }
  }
  render() {
    const page = Selector.getCurrentPage(this.props.state);
    if (!page) {
      return <RN.View />;
    }
    return (
      <RN.TouchableOpacity onPress={() => this.doAction(page.routeName)}>
        {this.getIcon(page.routeName)}
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
