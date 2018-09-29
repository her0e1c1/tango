import * as React from 'react';
import * as NB from 'native-base';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as Selector from 'src/selector';
import Icon from 'react-native-vector-icons/FontAwesome';

const ShowBackButton = (state: RootState): boolean => {
  const i = state.nav.index;
  const r = state.nav.routes;
  return !!r && r[i].index >= 1;
};

type Props = Pick<ConnectedProps, 'dispatch' | 'state'>;

class LeftButton extends React.Component<Props, {}> {
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

class RightButton extends React.Component<Props, {}> {
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
      await dispatch(Action.cardUpdate(this.props.state.card.edit));
      await dispatch(Action.nav.goBack());
    } else if (name === 'cardNew') {
      const card = this.props.state.card.edit;
      await dispatch(Action.cardBulkInsert(card.deck_id, [card]));
      await dispatch(Action.nav.goBack());
    } else if (name === 'deckEdit') {
      const deck = this.props.state.deck.edit;
      await dispatch(Action.deckUpdate(deck));
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
          // if string is empty, it causes the error:
          // out of <Text />, so you need to return boolean instead of string
          !!card.hint &&
          !!card.hint.trim() && (
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

class Body extends React.Component<Props, {}> {
  getTitle() {
    const page = Selector.getCurrentPage(this.props.state);
    const names = {
      home: 'Decks',
      share: 'Import Decks',
      spreadsheet: 'Google Spread Sheet',
      inputUrl: 'Import By Url',
    };
    if (page) {
      return names[page.routeName] || '';
    }
    return '';
  }
  render() {
    const { state, dispatch } = this.props;
    const title = this.getTitle();
    if (title) {
      return (
        <NB.Body>
          <NB.Title>{title}</NB.Title>
        </NB.Body>
      );
    }
    const deck = Selector.getCurrentDeck(state);
    return (
      <NB.Body>
        <RN.TouchableOpacity
          onPress={() =>
            dispatch(Action.nav.goTo('deck', { deck_id: deck.id }))
          }
        >
          <NB.Title>{deck && deck.name && `${deck.name}`} </NB.Title>
        </RN.TouchableOpacity>
      </NB.Body>
    );
  }
}

class _Header extends React.Component<ConnectedProps, {}> {
  render() {
    const { state, dispatch } = this.props;
    if (!state.config.showHeader) {
      return <NB.View />;
    }
    return (
      <NB.Header>
        <LeftButton state={state} dispatch={dispatch} />
        <Body state={state} dispatch={dispatch} />
        <RightButton state={state} dispatch={dispatch} />
      </NB.Header>
    );
  }
}
export const Header = connect(state => ({ state }))(_Header);
