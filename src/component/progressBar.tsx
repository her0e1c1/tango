import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as I from 'src/interface';
import * as Action from 'src/action';
import * as Selector from 'src/selector';

class ProgressBar extends React.Component<
  Props & { deck_id: number; showCardIndex?: boolean },
  {}
> {
  render() {
    if (!this.props.state.config.showHeader) {
      return null;
    }
    const deck_id = this.props.deck_id;
    const index = this.props.showCardIndex
      ? `(${this.props.state.config.cardIndex})`
      : '';
    const cards = Selector.getCardList(this.props.state, deck_id);
    const mastered = cards.filter(x => !!x && x.mastered);
    const width = cards.length > 0 ? mastered.length / cards.length * 100 : 0;
    return (
      <RN.View
        style={{
          height: 20,
          backgroundColor: '#DEE2E6',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <RN.View
          style={{
            height: 20,
            width: `${width}%`,
            backgroundColor: '#51CF66',
          }}
        />
        <RN.View
          style={{
            flex: 1,
            position: 'absolute',
            left: 0,
            right: 0,
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            paddingRight: 5,
          }}
        >
          <RN.Text
            style={{
              fontSize: 13,
              fontWeight: 'bold',
            }}
          >{`${mastered.length}/${cards.length}${index}`}</RN.Text>
        </RN.View>
      </RN.View>
    );
  }
}

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(ProgressBar);
