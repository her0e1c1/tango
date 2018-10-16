import * as React from 'react';
import * as NB from 'native-base';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/react-native/action';
import { getSelector } from 'src/selector';
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
          onPress={() => dispatch(Action.goBack())}
          // onLongPress={() => dispatch(Action.goHome())}
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
    const selector = getSelector(this.props.state);
    if (name === 'cardEdit') {
      await dispatch(Action.cardUpdate(this.props.state.card.edit));
      await dispatch(Action.goBack());
    } else if (name === 'cardNew') {
      const card = this.props.state.card.edit;
      await dispatch(Action.cardCreate(card));
      await dispatch(Action.goBack());
    } else if (name === 'deckEdit') {
      const deck = this.props.state.deck.edit;
      await dispatch(Action.deckUpdate(deck));
      await dispatch(Action.goBack());
    } else if (name === 'deck') {
      const deck = selector.deck.current;
      await dispatch(
        Action.goTo('cardNew', {
          deckId: deck.id,
        })
      );
    } else {
      const card = selector.card.currentCard;
      await dispatch(
        Action.goTo('cardEdit', {
          cardId: card.id,
        })
      );
    }
  }
  render() {
    const { dispatch } = this.props;
    const selector = getSelector(this.props.state);
    const page = selector.deck.getCurrentPage();
    if (!page) {
      return <NB.Right />;
    }
    const card = selector.card.currentCard;
    return (
      <NB.Right>
        {page.routeName === 'card' &&
          // if string is empty, it causes the error:
          // out of <Text />, so you need to return boolean instead of string
          !!card.hint &&
          !!card.hint.trim() && (
            <NB.Button
              transparent
              onPress={() => dispatch(Action.configToggle('showHint'))}
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
  getTitle(page?: NavState) {
    const names = {
      home: 'Decks',
      share: 'Import Decks',
      spreadsheet: 'Google Spread Sheet',
      inputUrl: 'Import By Url',
      publicDeckList: 'Public Decks',
    };
    if (page) {
      return names[page.routeName] || '';
    }
    return '';
  }
  render() {
    const selector = getSelector(this.props.state);
    const { dispatch } = this.props;
    const title = this.getTitle(selector.deck.getCurrentPage());
    if (title) {
      return (
        <NB.Body>
          <NB.Title>{title}</NB.Title>
        </NB.Body>
      );
    }
    const deck = selector.deck.current;
    return (
      <NB.Body>
        <RN.TouchableOpacity
          onPress={() => dispatch(Action.goTo('deck', { deckId: deck.id }))}
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
