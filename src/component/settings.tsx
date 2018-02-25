import * as Action from 'src/action';
import * as I from 'src/interface';
import * as NB from 'native-base';
import * as React from 'react';
import * as RN from 'react-native';
import Header from './header';
import { connect } from 'react-redux';
import { Container, SettingsItem, SettingsText } from './styled';
import { version } from 'punycode';

const cardSwipeTypes: cardSwipe[] = [
  'goBack',
  'goToPrevCard',
  'goToNextCard',
  'goToNextCardMastered',
  'goToNextCardNotMastered',
  'goToNextCardToggleMastered',
];

const handleLogin = props =>
  RN.Alert.alert('Choose account', '', [
    {
      text: 'Facebook',
      onPress: () => props.loginWithFacebook(),
    },
    {
      text: 'Google(with Drive)',
      onPress: () => props.loginWithGoogleOnWeb(),
    },
    {
      text: 'Google',
      onPress: () => props.loginWithGoogle(),
    },
    { text: 'Cancel', onPress: () => {} },
  ]);

const handleLogout = props =>
  RN.Alert.alert('Do you want to logout?', '', [
    {
      text: 'Logout',
      onPress: () => props.logout(),
    },
    { text: 'Cancel', onPress: () => {} },
  ]);

export class Settings extends React.Component<Props, {}> {
  state = { version: undefined };
  componentDidMount() {
    RN.AsyncStorage.getItem('version').then(version =>
      this.setState({ version })
    );
  }
  render() {
    const { config, user } = this.props.state;
    const isLogin = user && user.displayName;
    return (
      <Container>
        <RN.ScrollView>
          <SettingsItem>
            <SettingsText>Login</SettingsText>
            <RN.Button
              title={isLogin ? user.displayName! : 'LOGIN'}
              onPress={() =>
                !isLogin ? handleLogin(this.props) : handleLogout(this.props)
              }
            />
          </SettingsItem>

          <SettingsItem>
            <SettingsText>Show Mastered Cards</SettingsText>
            <NB.CheckBox
              checked={config.showMastered}
              onPress={() =>
                this.props.update({
                  showMastered: !config.showMastered,
                })
              }
            />
          </SettingsItem>

          <SettingsItem>
            <SettingsText>Shuffle cards</SettingsText>
            <NB.CheckBox
              checked={config.shuffled}
              onPress={async () => {
                await this.props.update({ shuffled: !config.shuffled });
                await this.props.shuffle();
              }}
            />
          </SettingsItem>

          <SettingsItem>
            <SettingsText>Show header in main screen</SettingsText>
            <NB.CheckBox
              checked={config.showHeader}
              onPress={async () => {
                await this.props.update({ showHeader: !config.showHeader });
              }}
            />
          </SettingsItem>

          <SettingsItem>
            <SettingsText>
              Hide body when you go to next/prev cards
            </SettingsText>
            <NB.CheckBox
              checked={config.hideBodyWhenCardChanged}
              onPress={() =>
                this.props.update({
                  hideBodyWhenCardChanged: !config.hideBodyWhenCardChanged,
                })
              }
            />
          </SettingsItem>

          <SettingsItem>
            <SettingsText>theme</SettingsText>
            <NB.Picker
              textStyle={{ color: 'cornflowerblue' }}
              selectedValue={config.theme}
              onValueChange={theme => this.props.update({ theme })}
            >
              {['default', 'dark'].map(x => (
                <NB.Picker.Item label={x} value={x} />
              ))}
            </NB.Picker>
          </SettingsItem>

          <SettingsItem style={{ justifyContent: 'flex-start' }}>
            <SettingsText>Start from {config.start}</SettingsText>
            <RN.Slider
              style={{ flex: 1 }}
              minimumValue={0}
              value={config.start / 1000}
              onSlidingComplete={v =>
                this.props.update({ start: parseInt(String(1000 * v)) })
              }
            />
          </SettingsItem>

          <SettingsItem>
            <SettingsText>App Cache</SettingsText>
            <RN.Button
              title="Clear"
              onPress={() => {
                RN.Alert.alert('Are you sure?', '', [
                  {
                    text: 'DROP ALL TABLES',
                    onPress: () => this.props.drop(),
                  },
                  {
                    text: 'CLEAR ALL',
                    onPress: () => this.props.clearAll(true),
                  },
                  {
                    text: 'CLEAR (keep login)',
                    onPress: () => this.props.clearAll(),
                  },
                  { text: 'Cancel', onPress: () => {} },
                ]);
              }}
            />
          </SettingsItem>

          {[
            ['cardSwipeUp', 'up'],
            ['cardSwipeDown', 'down'],
            ['cardSwipeLeft', 'left'],
            ['cardSwipeRight', 'right'],
          ].map(([type, label]) => (
            <SettingsItem>
              <SettingsText>Swipe {label}</SettingsText>
              <NB.Picker
                textStyle={{ color: 'cornflowerblue' }}
                selectedValue={config[type]}
                onValueChange={v => this.props.update({ [type]: v })}
              >
                {cardSwipeTypes.map(x => (
                  <NB.Picker.Item label={x} value={x} />
                ))}
              </NB.Picker>
            </SettingsItem>
          ))}

          <SettingsItem>
            <SettingsText>Version</SettingsText>
            <SettingsText>{this.state.version || ''}</SettingsText>
          </SettingsItem>

          <SettingsItem>
            <RN.TouchableOpacity
              onPress={() => this.props.refresh()}
              onLongPress={() => alert(config.googleRefreshToken)}
            >
              <SettingsText>Refresh: {config.googleAccessToken}</SettingsText>
            </RN.TouchableOpacity>
          </SettingsItem>
        </RN.ScrollView>
      </Container>
    );
  }
}

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  update: Action.config.updateConfig,
  shuffle: Action.shuffleCardsOrSort,
  clearAll: Action.config.clearAll,
  loginWithFacebook: Action.auth.loginWithFacebook,
  loginWithGoogle: Action.auth.loginWithGoogle,
  loginWithGoogleOnWeb: Action.auth.loginWithGoogleOnWeb,
  refresh: Action.auth.refreshToken,
  logout: Action.auth.logout,
  drop: Action.config.drop,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(Settings);
