import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import CardView from './cardView';
import * as SD from './styled';

@connect(state => ({ state }))
export class CardDetail extends React.Component<{ onLongPress: Callback }, {}> {
  static navigationOptions = () => ({
    gesturesEnabled: false,
  });
  componentDidMount() {
    RN.StatusBar.setHidden(true);
  }
  componentWillUnmount() {
    RN.StatusBar.setHidden(false);
  }
  render() {
    const window = RN.Dimensions.get('window');
    const height = window.height;
    const card = Action.getCurrentCard(this.props.state);
    return (
      <RN.Modal
        animationType={'none'}
        supportedOrientations={['portrait', 'landscape']}
        visible={true}
        onRequestClose={() => {}}
      >
        <RN.TouchableWithoutFeedback onLongPress={this.props.onLongPress}>
          <RN.View style={{ flex: 1 }}>
            <CardView card={card} />
            <SD.SideControl
              style={{ left: 0, height }}
              onPress={() => this.props.dispatch(Action.nav.goToPrevCard())}
              onLongPress={() => {}}
            />
            <SD.SideControl
              style={{ right: 0, height }}
              onPress={() => this.props.dispatch(Action.nav.goToNextCard())}
              onLongPress={() => alert(JSON.stringify(card.name))}
            />
          </RN.View>
        </RN.TouchableWithoutFeedback>
      </RN.Modal>
    );
  }
}
