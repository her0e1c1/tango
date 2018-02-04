import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import DeckSwiper from 'react-native-deck-swiper';
import { withTheme } from 'styled-components';
import { connect } from 'react-redux';
import ProgressBar from './progressBar';
import CardView from './cardView';
import MasteredCircle from './masteredCircle';
import * as SD from './styled';
import * as I from 'src/interface';

class CardDetail extends React.Component<
  Props & { onLongPress: Callback },
  {}
> {
  componentDidMount() {
    RN.StatusBar.setHidden(true);
  }
  componentWillUnmount() {
    RN.StatusBar.setHidden(false);
  }
  render() {
    const window = RN.Dimensions.get('window');
    const height = window.height;
    return (
      <RN.Modal
        animationType={'none'}
        supportedOrientations={['portrait', 'landscape']}
        visible={true}
        onRequestClose={() => {}}
      >
        <RN.TouchableWithoutFeedback
          style={{ flex: 1, backgroundColor: 'black' }}
          onLongPress={this.props.onLongPress}
        >
          <RN.View style={{ flex: 1, backgroundColor: 'black' }}>
            <CardView card={this.props.card} />
            <SD.SideControl
              style={{ left: 0, height }}
              onPress={() => this.props.goToPrevCard()}
              onLongPress={() => alert(JSON.stringify(this.props.nav))}
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

const mapStateToProps = (state: RootState) => ({
  state,
  card: Action.getCurrentCard(state) || ({} as Card),
});
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  goTo: Action.goTo,
  goToNextCard: Action.goToNextCard,
  goToPrevCard: Action.goToPrevCard,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(CardDetail);
