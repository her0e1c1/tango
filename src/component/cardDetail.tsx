import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import CardView from './cardView';
import * as SD from './styled';
import * as I from 'src/interface';
import { withNavigation } from 'react-navigation';

@withNavigation
class CardDetail extends React.Component<
  Props & { onLongPress: Callback },
  {}
> {
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
    const { deck_id } = this.props.navigation.state.params;
    const window = RN.Dimensions.get('window');
    const height = window.height;
    const card = Action.getCurrentCard(this.props.state, deck_id);
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
              onPress={() => this.props.goToPrevCard()}
              onLongPress={() => {}}
            />
            <SD.SideControl
              style={{ right: 0, height }}
              onPress={() => this.props.goToNextCard()}
              onLongPress={() => alert(JSON.stringify(this.props.card.name))}
            />
          </RN.View>
        </RN.TouchableWithoutFeedback>
      </RN.Modal>
    );
  }
}

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  goToNextCard: Action.goToNextCard,
  goToPrevCard: Action.goToPrevCard,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(CardDetail);
