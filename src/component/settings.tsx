import * as Action from 'src/action';
import * as C from 'src/constant';
import * as NB from 'native-base';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import { Container, SettingsItem, SettingsText } from './styled';

// HOTFIX: Wait for index.d.ts to be fixed
const Picker = (props: any) => <NB.Picker {...props} />;

const cardSwipeTypes: cardSwipe[] = [
  'goBack',
  'goToPrevCard',
  'goToNextCard',
  'goToNextCardMastered',
  'goToNextCardNotMastered',
  'goToNextCardToggleMastered',
];

export class _Settings extends React.Component<ConnectedProps, {}> {
  state = { version: undefined };

  componentDidMount() {
    RN.AsyncStorage.getItem('version').then(version =>
      this.setState({ version })
    );
  }
  handleLogin() {
    const { dispatch } = this.props;
    RN.Alert.alert('Choose account', '', [
      {
        text: 'Facebook',
        onPress: () => dispatch(Action.auth.loginWithFacebook()),
      },
      {
        text: 'Google(with Drive)',
        onPress: () => dispatch(Action.auth.loginWithGoogleOnWeb()),
      },
      {
        text: 'Google',
        onPress: () => dispatch(Action.auth.loginWithGoogle()),
      },
      { text: 'Cancel', onPress: () => {} },
    ]);
  }

  handleLogout() {
    const { dispatch } = this.props;
    RN.Alert.alert('Do you want to logout?', '', [
      {
        text: 'Logout',
        onPress: () => dispatch(Action.auth.logout()),
      },
      { text: 'Cancel', onPress: () => {} },
    ]);
  }

  render() {
    const { dispatch } = this.props;
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
                !isLogin ? this.handleLogin() : this.handleLogout()
              }
            />
          </SettingsItem>

          <SettingsItem>
            <SettingsText>Show Mastered Cards</SettingsText>
            <NB.CheckBox
              checked={config.showMastered}
              onPress={() =>
                dispatch(
                  Action.config.updateConfig({
                    showMastered: !config.showMastered,
                  })
                )
              }
            />
          </SettingsItem>

          <SettingsItem>
            <SettingsText>Shuffle cards</SettingsText>
            <NB.CheckBox
              checked={config.shuffled}
              onPress={async () => {
                await dispatch(
                  Action.config.updateConfig({ shuffled: !config.shuffled })
                );
                await dispatch(Action.shuffleCardsOrSort());
              }}
            />
          </SettingsItem>

          <SettingsItem>
            <SettingsText>Show header in main screen</SettingsText>
            <NB.CheckBox
              checked={config.showHeader}
              onPress={async () => {
                await dispatch(
                  Action.config.updateConfig({ showHeader: !config.showHeader })
                );
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
                dispatch(
                  Action.config.updateConfig({
                    hideBodyWhenCardChanged: !config.hideBodyWhenCardChanged,
                  })
                )
              }
            />
          </SettingsItem>

          <SettingsItem>
            <SettingsText>theme</SettingsText>
            <Picker
              textStyle={{ color: 'cornflowerblue' }}
              selectedValue={config.theme}
              onValueChange={theme =>
                dispatch(Action.config.updateConfig({ theme }))
              }
            >
              {['default', 'dark'].map(x => (
                <NB.Picker.Item label={x} value={x} />
              ))}
            </Picker>
          </SettingsItem>

          <SettingsItem style={{ justifyContent: 'flex-start' }}>
            <SettingsText>Start from {config.start}</SettingsText>
            <RN.Slider
              style={{ flex: 1 }}
              minimumValue={0}
              value={config.start / 1000}
              onSlidingComplete={v =>
                dispatch(
                  Action.config.updateConfig({
                    start: parseInt(String(1000 * v)),
                  })
                )
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
                    onPress: () => dispatch(Action.config.drop()),
                  },
                  {
                    text: 'CLEAR ALL',
                    onPress: () => dispatch(Action.config.clearAll(true)),
                  },
                  {
                    text: 'CLEAR (keep login)',
                    onPress: () => dispatch(Action.config.clearAll()),
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
              <Picker
                textStyle={{ color: 'cornflowerblue' }}
                selectedValue={config[type]}
                onValueChange={v =>
                  dispatch(Action.config.updateConfig({ [type]: v }))
                }
              >
                {cardSwipeTypes.map(x => (
                  <NB.Picker.Item label={x} value={x} />
                ))}
              </Picker>
            </SettingsItem>
          ))}

          <SettingsItem>
            <SettingsText>GIT HASH</SettingsText>
            <SettingsText>{C.GIT_HASH.substring(0, 7)}</SettingsText>
          </SettingsItem>

          <SettingsItem>
            <SettingsText>Version</SettingsText>
            <SettingsText>{this.state.version || ''}</SettingsText>
          </SettingsItem>

          <SettingsItem>
            <RN.TouchableOpacity
              onPress={() => dispatch(Action.auth.refreshToken())}
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
export const Settings = connect(state => ({ state }))(_Settings);
