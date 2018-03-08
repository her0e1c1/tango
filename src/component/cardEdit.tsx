import * as React from 'react';
import * as RN from 'react-native';
import * as SD from './styled';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import { MasteredCircle } from './card';
import { ErrorPage } from './utils';

type TextInputRef =
  | React.Component<RN.TextInputProperties, {}> & { focus: any } // no document?
  | null;

class Field extends React.Component<
  { value: string; name: string; onChangeText: (value: string) => void },
  {}
> {
  private input: TextInputRef;
  render() {
    return (
      <RN.View>
        <SD.CardEditTitle>{`${this.props.name}:`}</SD.CardEditTitle>
        <RN.TouchableWithoutFeedback
          onPress={() => this.input && this.input.focus()}
        >
          <SD.CardEditInputView>
            <RN.TextInput
              ref={r => (this.input = r as TextInputRef)}
              value={this.props.value}
              multiline
              onChangeText={this.props.onChangeText}
            />
          </SD.CardEditInputView>
        </RN.TouchableWithoutFeedback>
      </RN.View>
    );
  }
}

export class _CardEdit extends React.Component<
  ConnectedProps & { card_id: number },
  Card
> {
  async componentDidMount() {
    const { dispatch } = this.props;
    const card = this.props.state.card.byId[this.props.card_id];
    await dispatch(Action.card.edit(card));
  }
  render() {
    const { dispatch } = this.props;
    if (!this.props.card_id) return <ErrorPage />; // DEFENSIVE
    const card = this.props.state.card.edit;
    return (
      <RN.ScrollView>
        <MasteredCircle card={card} />
        <SD.CardEditTitle>ID: {`${card.id}(${card.fkid})`}</SD.CardEditTitle>
        <Field
          name={'TITLE'}
          value={card.name}
          onChangeText={name => dispatch(Action.card.edit({ name }))}
        />
        <Field
          name={'BODY'}
          value={card.body}
          onChangeText={body => dispatch(Action.card.edit({ body }))}
        />
        <Field
          name={'HINT'}
          value={card.hint}
          onChangeText={hint => dispatch(Action.card.edit({ hint }))}
        />
      </RN.ScrollView>
    );
  }
}
export const CardEdit = connect(state => ({ state }))(_CardEdit);

export class _CardNew extends React.Component<
  ConnectedProps & { deck_id: number },
  Card
> {
  constructor(props) {
    super(props);
    this.state = { deck_id: this.props.deck_id } as Card;
  }
  render() {
    const card = this.state;
    return (
      <RN.ScrollView>
        <SD.Button
          title="CREATE A NEW CARD"
          onPress={async () => {
            await this.props.dispatch(
              Action.card.bulkInsertCards(this.state.deck_id, [this.state])
            );
            await this.props.dispatch(Action.nav.goBack());
          }}
        />
        <Field
          name={'TITLE'}
          value={card.name}
          onChangeText={name => this.setState({ name })}
        />
        <Field
          name={'BODY'}
          value={card.body}
          onChangeText={body => this.setState({ body })}
        />
        <Field
          name={'HINT'}
          value={card.hint}
          onChangeText={hint => this.setState({ hint })}
        />
      </RN.ScrollView>
    );
  }
}
export const CardNew = connect(state => ({ state }))(_CardNew);
