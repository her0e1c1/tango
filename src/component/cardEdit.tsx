import * as React from 'react';
import * as RN from 'react-native';
import * as SD from './styled';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import { MasteredCircle } from './card';

export class _CardEdit extends React.Component<
  ConnectedProps & { card_id: number },
  Card
> {
  constructor(props) {
    super(props);
    this.state = this.props.state.card.byId[this.props.card_id];
  }
  render() {
    const card = this.state;
    return (
      <RN.ScrollView>
        <MasteredCircle card={card} />
        <SD.CardEditTitle>ID: {`${card.id}(${card.fkid})`}</SD.CardEditTitle>

        <SD.CardEditTitle>TITLE:</SD.CardEditTitle>
        <SD.CardEditInputView>
          <RN.TextInput
            value={card.name}
            multiline
            onChangeText={name => this.setState({ name })}
          />
        </SD.CardEditInputView>

        <SD.CardEditTitle>BODY:</SD.CardEditTitle>
        <SD.CardEditInputView>
          <RN.TextInput
            value={card.body}
            multiline
            onChangeText={body => this.setState({ body })}
          />
        </SD.CardEditInputView>

        <SD.CardEditTitle>HINT:</SD.CardEditTitle>
        <SD.CardEditInputView>
          <RN.TextInput
            value={card.hint}
            multiline
            onChangeText={hint => this.setState({ hint })}
          />
        </SD.CardEditInputView>

        <SD.Button
          title="UPDATE THIS CARD"
          onPress={async () => {
            await this.props.dispatch(Action.updateCard(this.state));
            await this.props.dispatch(Action.nav.goBack());
          }}
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
        <SD.CardEditTitle>TITLE:</SD.CardEditTitle>
        <SD.CardEditInputView style={{ height: 50 }}>
          <RN.TextInput
            value={card.name}
            multiline
            onChangeText={name => this.setState({ name })}
          />
        </SD.CardEditInputView>

        <SD.CardEditTitle>BODY:</SD.CardEditTitle>
        <SD.CardEditInputView>
          <RN.TextInput
            value={card.body}
            multiline
            numberOfLines={5}
            onChangeText={body => this.setState({ body })}
          />
        </SD.CardEditInputView>

        <SD.CardEditTitle>HINT:</SD.CardEditTitle>
        <SD.CardEditInputView>
          <RN.TextInput
            value={card.hint}
            multiline
            numberOfLines={5}
            onChangeText={hint => this.setState({ hint })}
          />
        </SD.CardEditInputView>
        <SD.Button
          title="CREATE A NEW CARD"
          onPress={async () => {
            await this.props.dispatch(
              Action.bulkInsertCards(this.state.deck_id, [this.state])
            );
            await this.props.dispatch(Action.nav.goBack());
          }}
        />
      </RN.ScrollView>
    );
  }
}
export const CardNew = connect(state => ({ state }))(_CardNew);
