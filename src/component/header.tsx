import styled from 'styled-components';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Redux from 'redux';
import * as Action from 'src/action';
import * as I from 'src/interface';
import SearchBar from './searchBar';

const MainText = styled(RN.Text)`
  color: ${({ theme }: AppContext) => theme.titleColor};
  font-size: 16px;
`;

const mapStateToProps = (state: RootState) => ({
  nav: state.nav,
  state,
});
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  goBack: Action.goBack,
  goHome: Action.goHome,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;

export class Header extends React.Component<Props, {}> {
  render() {
    if (!this.props.state.config.showHeader) {
      return <RN.View />;
    }
    const { deck } = this.props.nav;
    return (
      <RN.View style={{ marginBottom: 10 }}>
        <RN.View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 5,
          }}
        >
          <MainText>TANGO FOR MEMO {deck && `(${deck.name})`}</MainText>
          {deck && (
            <RN.TouchableOpacity
              onPress={() => this.props.goBack()}
              onLongPress={() => this.props.goHome()}
            >
              <MainText>{'< BACK'}</MainText>
            </RN.TouchableOpacity>
          )}
        </RN.View>
        {!deck && <SearchBar />}
      </RN.View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);