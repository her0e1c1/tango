import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import MasteredCircle from './masteredCircle';
import { withNavigation } from 'react-navigation';

@withNavigation
@connect(state => ({ state }))
export class CardEdit extends React.Component<
  { state: RootState; card: Card },
  Card
> {
  constructor(props) {
    super(props);
    // const { card } = this.props;
    const { card } = this.props.navigation.state.params;
    this.state = card;
  }
  render() {
    const card = this.state;
    return (
      <RN.View>
        <RN.Button
          color={'red'}
          title="UPDATE"
          onPress={async () => {
            await this.props.dispatch(Action.updateCard(this.state));
            this.props.navigation.goBack();
          }}
        />
        <MasteredCircle card={card} />
        <RN.TextInput value={card.category} />
        <RN.TextInput
          value={card.name}
          multiline
          onChangeText={name => this.setState({ name })}
        />
        <RN.TextInput
          value={card.body}
          multiline
          onChangeText={body => this.setState({ body })}
        />
        <RN.TextInput
          value={card.hint}
          multiline
          onChangeText={hint => this.setState({ hint })}
        />
        <RN.Button
          color={'red'}
          title="DUMP"
          onPress={() => alert(JSON.stringify(card))}
        />
      </RN.View>
    );
  }
}
