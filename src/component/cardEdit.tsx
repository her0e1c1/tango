import * as React from 'react';
import * as RN from 'react-native';
import * as SD from './styled';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import { MasteredCircle } from './card';
import { withTheme } from 'styled-components';
import { withNavigation } from 'react-navigation';

@withTheme
@withNavigation
@connect(state => ({ state }))
export class CardEdit extends React.Component<
  { state: RootState; card: Card } & AppContext,
  Card
> {
  constructor(props) {
    super(props);
    const { card } = this.props.navigation.state.params;
    this.state = card;
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

        <RN.Button
          color={this.props.theme.mainColor}
          title="UPDATE THIS CARD"
          onPress={async () => {
            await this.props.dispatch(Action.updateCard(this.state));
            this.props.navigation.goBack();
          }}
        />
      </RN.ScrollView>
    );
  }
}

@withTheme
@withNavigation
@connect(state => ({ state }))
export class CardNew extends React.Component<
  { state: RootState } & AppContext,
  Card
> {
  constructor(props) {
    super(props);
    const { deck_id } = this.props.navigation.state.params;
    this.state = { deck_id } as Card;
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

        <RN.Button
          color={this.props.theme.mainColor}
          title="CREATE A NEW CARD"
          onPress={async () => {
            await this.props.dispatch(
              Action.bulkInsertCards(this.state.deck_id, [this.state])
            );
            this.props.navigation.goBack();
          }}
        />
      </RN.ScrollView>
    );
  }
}
