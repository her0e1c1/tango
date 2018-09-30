import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import * as Action from 'src/react-native/action';
import * as C from 'src/constant';
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

// Because save icon is in header, you can not use component state
// and use reducer state instead to pass user input
export class _CardEdit extends React.Component<
  ConnectedProps & { card_id: number },
  {}
> {
  cardEdit(edit: Partial<Card>) {
    const card = this.props.state.card.byId[this.props.card_id];
    this.props.dispatch(Action.cardUpdate({ ...card, ...edit }));
  }
  render() {
    const { dispatch } = this.props;
    if (!this.props.card_id) return <ErrorPage />; // DEFENSIVE
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

          <NB.ListItem noBorder>
            <NB.Body>
              <NB.Text>Category</NB.Text>
            </NB.Body>
            <NB.Right>
              <NB.Picker
                style={{
                  width: RN.Platform.OS === 'android' ? 120 : undefined,
                }}
                selectedValue={card.category || ''}
                onValueChange={category => this.cardEdit({ category })}
                {...{ iosIcon: <NB.Icon name="arrow-down" /> }}
              >
                {[''].concat(C.CATEGORY).map((x, i) => (
                  <NB.Picker.Item key={i} label={x} value={x} />
                ))}
              </NB.Picker>
            </NB.Right>
          </NB.ListItem>
        </NB.List>
        <NB.Form>
          <Field
            name={'TITLE'}
            value={card.frontText}
            onChangeText={frontText => this.cardEdit({ frontText })}
          />
          <Field
            name={'HINT'}
            value={card.hint}
            onChangeText={hint => this.cardEdit({ hint })}
          />
          <Field
            name={'BODY'}
            value={card.backText}
            rowSpan={10}
            onChangeText={backText => this.cardEdit({ backText })}
          />
        </NB.Form>
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
                    await dispatch(Action.cardDelete(card));
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
  ConnectedProps & { deck_id: number },
  {}
> {
  render() {
    if (!this.props.deck_id) return <ErrorPage />; // DEFENSIVE
    const card = this.props.state.card.edit;
    return (
      <NB.Content padder style={{ marginBottom: 50 }}>
        <NB.Form>
          <Field
            name={'TITLE'}
            value={card.frontText}
            // onChangeText={name => this.cardEdit({ name })}
          />
          <Field
            name={'HINT'}
            value={card.hint}
            // onChangeText={hint => dispatch(Action.card.edit({ hint }))}
          />
          <Field
            name={'BODY'}
            value={card.backText}
            // onChangeText={body => dispatch(Action.card.edit({ body }))}
          />
        </NB.Form>
      </NB.Content>
    );
  }
}
export const CardNew = connect(state => ({ state }))(_CardNew);
