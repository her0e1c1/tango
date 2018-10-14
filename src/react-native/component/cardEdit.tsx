import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import * as Action from 'src/react-native/action';
import { ErrorPage } from './utils';

class Field extends React.Component<
  {
    value: string;
    name: string;
    rowSpan?: number;
    onChangeText: (value: string) => void;
  },
  {}
> {
  render() {
    return (
      <NB.View>
        <NB.Separator>
          <NB.Text>{this.props.name}</NB.Text>
        </NB.Separator>
        <NB.Textarea
          style={{ flex: 1, backgroundColor: 'white', marginBottom: 10 }}
          rowSpan={this.props.rowSpan || 5}
          value={this.props.value}
          onChangeText={this.props.onChangeText}
        />
      </NB.View>
    );
  }
}

class CardForm extends React.Component<{
  card: Card;
  onChangeText: (c: Partial<Card>) => void;
}> {
  render() {
    const card = this.props.card;
    return (
      <NB.Form>
        <Field
          name={'Front Text'}
          value={card.frontText}
          onChangeText={frontText => this.props.onChangeText({ frontText })}
        />
        <Field
          name={'Back Text'}
          value={card.backText}
          onChangeText={backText => this.props.onChangeText({ backText })}
        />
        <Field
          name={'Hint'}
          value={card.hint}
          onChangeText={hint => this.props.onChangeText({ hint })}
        />
      </NB.Form>
    );
  }
}

// Because save icon is in header, you can not use component state
// and use reducer state instead to pass user input
export class _CardEdit extends React.Component<
  ConnectedProps & { cardId: string }
> {
  componentDidMount() {
    const card = this.props.state.card.byId[this.props.cardId];
    this.props.dispatch(Action.cardEdit({ ...card }));
  }
  cardEdit(edit: Partial<Card>) {
    const card = this.props.state.card.edit;
    this.props.dispatch(Action.cardEdit({ ...card, ...edit }));
  }
  render() {
    const { dispatch } = this.props;
    if (!this.props.cardId) return <ErrorPage />; // DEFENSIVE
    const card = this.props.state.card.edit;
    return (
      <NB.Content padder style={{ marginBottom: 50 }}>
        <NB.List>
          <NB.ListItem noBorder>
            <NB.Body>
              <NB.Text>ID</NB.Text>
            </NB.Body>
            <NB.Right>
              <NB.Text>{card.id}</NB.Text>
            </NB.Right>
          </NB.ListItem>

          <NB.ListItem noBorder>
            <NB.Body>
              <NB.Text>Mastered</NB.Text>
            </NB.Body>
            <NB.Right>
              <RN.Switch
                value={Boolean(card.mastered)}
                onValueChange={mastered => this.cardEdit({ mastered })}
              />
            </NB.Right>
          </NB.ListItem>
        </NB.List>
        <CardForm
          card={this.props.state.card.edit}
          onChangeText={card => this.cardEdit(card)}
        />
        <NB.Button
          danger
          full
          style={{ marginVertical: 10 }}
          onPress={() =>
            RN.Alert.alert(
              'Delete This Card',
              'Are you sure?',
              [
                {
                  text: 'Cancel',
                  onPress: () => undefined,
                  style: 'cancel',
                },
                {
                  text: 'Delete',
                  onPress: async () => {
                    await dispatch(Action.cardDelete(card.id));
                    await dispatch(Action.goBack());
                  },
                },
              ],
              { cancelable: false }
            )
          }
        >
          <NB.Text>DELETE</NB.Text>
        </NB.Button>
      </NB.Content>
    );
  }
}
export const CardEdit = connect(state => ({ state }))(_CardEdit);

export class _CardNew extends React.Component<
  ConnectedProps & { deckId: string }
> {
  componentDidMount() {
    this.props.dispatch(Action.cardEditInit());
  }
  render() {
    if (!this.props.deckId) return <ErrorPage />; // DEFENSIVE
    const deckId = this.props.deckId;
    return (
      <NB.Content padder style={{ marginBottom: 50 }}>
        <CardForm
          card={this.props.state.card.edit}
          onChangeText={card =>
            this.props.dispatch(
              Action.cardEdit({
                ...this.props.state.card.edit,
                ...card,
                deckId,
              })
            )
          }
        />
      </NB.Content>
    );
  }
}
export const CardNew = connect(state => ({ state }))(_CardNew);
