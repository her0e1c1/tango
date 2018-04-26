import * as React from 'react';
import * as NB from 'native-base';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as Selector from 'src/selector';
import Icon from 'react-native-vector-icons/FontAwesome';
import SearchBar from './searchBar';

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
      <NB.Left />
    ) : (
      <NB.Left>
        <NB.Button
          transparent
          onPress={() => dispatch(Action.nav.goBack())}
          onLongPress={() => dispatch(Action.nav.goHome())}
        >
          <NB.Icon name="arrow-back" />
        </NB.Button>
      </NB.Left>
    );
  }
}

export class RightButton extends React.Component<Props, {}> {
  getIcon(name: string) {
    if (['cardEdit', 'cardNew', 'deckEdit'].includes(name)) {
      return <Icon name="save" size={20} />;
    } else if (name === 'card') {
      return <Icon name="edit" size={20} />;
    } else if (['deck', 'card'].includes(name)) {
      return <NB.Icon name="md-add" />;
    } else {
      return <NB.View />;
    }
  }
  async doAction(name: string) {
    const { dispatch } = this.props;
    if (name === 'cardEdit') {
      await dispatch(Action.card.updateCard(this.props.state.card.edit));
      await dispatch(Action.nav.goBack());
    } else if (name === 'cardNew') {
      const card = this.props.state.card.edit;
      await dispatch(Action.card.bulkInsertCards(card.deck_id, [card]));
      await dispatch(Action.nav.goBack());
    } else if (name === 'deckEdit') {
      const deck = this.props.state.deck.edit;
      await dispatch(Action.deck.update(deck));
      await dispatch(Action.nav.goBack());
    } else if (name === 'deck') {
      // TODO: Fix to cardList
      const deck = Selector.getCurrentDeck(this.props.state);
      await dispatch(
        Action.nav.goTo('cardNew', {
          deck_id: deck.id,
        })
      );
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
    const { dispatch } = this.props;
    const page = Selector.getCurrentPage(this.props.state);
    if (!page) {
      return <NB.Right />;
    }
    const card = Selector.getCurrentCard(this.props.state) || {};
    return (
      <NB.Right>
        {page.routeName === 'card' &&
          !!card.hint && (
            <NB.Button
              transparent
              onPress={() => dispatch(Action.config.toggle('showHint'))}
            >
              <NB.Icon
                name={
                  this.props.state.config.showHint
                    ? 'md-help-circle'
                    : 'md-help'
                }
              />
            </NB.Button>
          )}
        <NB.Button transparent onPress={() => this.doAction(page.routeName)}>
          {this.getIcon(page.routeName)}
        </NB.Button>
      </NB.Right>
    );
  }
}

export class _Header extends React.Component<ConnectedProps, {}> {
  render() {
    const { state, dispatch } = this.props;
    if (!state.config.showHeader) {
      return <NB.View />;
    }
    const page = Selector.getCurrentPage(this.props.state);
    if (page && page.routeName === 'home') {
      return (
        <NB.Header>
          <NB.Body>
            <SearchBar />
          </NB.Body>
        </NB.Header>
      );
    }
    const deck = Selector.getCurrentDeck(state);
    return (
      <NB.Header>
        <LeftButton state={state} dispatch={dispatch} />
        <NB.Body>
          <RN.TouchableOpacity
            onPress={() =>
              dispatch(Action.nav.goTo('deck', { deck_id: deck.id }))
            }
          >
            <NB.Title>{deck && deck.name && `${deck.name}`} </NB.Title>
          </RN.TouchableOpacity>
        </NB.Body>
        <RightButton state={state} dispatch={dispatch} />
      </NB.Header>
    );
  }
}
export const Header = connect(state => ({ state }))(_Header);
