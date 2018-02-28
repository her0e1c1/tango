import * as React from 'react';
import * as RN from 'react-native';
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
        <RN.Text>Id: {`${card.id}(${card.fkid})`}</RN.Text>
        <RN.Text>Title:</RN.Text>
        <RN.TextInput
          value={card.name}
          multiline
          onChangeText={name => this.setState({ name })}
        />
        <RN.Text>Body:</RN.Text>
        <RN.TextInput
          value={card.body}
          multiline
          onChangeText={body => this.setState({ body })}
        />
        <RN.Text>Hint:</RN.Text>
        <RN.TextInput
          value={card.hint}
          multiline
          onChangeText={hint => this.setState({ hint })}
        />
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
      <RN.View>
        <RN.Text>Title:</RN.Text>
        <RN.TextInput
          value={card.name}
          multiline
          onChangeText={name => this.setState({ name })}
        />
        <RN.Text>Body:</RN.Text>
        <RN.TextInput
          value={card.body}
          multiline
          onChangeText={body => this.setState({ body })}
        />
        <RN.Text>Hint:</RN.Text>
        <RN.TextInput
          value={card.hint}
          multiline
          onChangeText={hint => this.setState({ hint })}
        />
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
      </RN.View>
    );
  }
}
