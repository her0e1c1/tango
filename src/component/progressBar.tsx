import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Selector from 'src/selector';
import * as SD from './styled';

@connect(state => ({ state }))
export class ProgressBar extends React.Component<
  { state: RootState } & { deck_id: number; showCardIndex?: boolean },
  {}
> {
  render() {
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
        <SD.ProgressBar width={`${width}%`} />
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
