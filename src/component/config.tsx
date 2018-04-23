import * as Action from 'src/action';
import * as C from 'src/constant';
import * as NB from 'native-base';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';

const cardSwipeTypes: cardSwipe[] = [
  'goBack',
  'goToPrevCard',
  'goToNextCard',
  'goToNextCardMastered',
  'goToNextCardNotMastered',
  'goToNextCardToggleMastered',
];

const clearAppCache = dispatch => {
  NB.ActionSheet.show(
    {
      title: 'Clear app cache',
      options: ['Clear', 'Clear (keep login)', 'Drop Tables', 'Cancel'],
      cancelButtonIndex: 3,
      destructiveButtonIndex: 2,
    },
    index => {
      switch (index) {
        case 0:
          dispatch(Action.config.clearAll());
        case 1:
          dispatch(Action.config.clearAll(true));
        case 2:
          dispatch(Action.config.drop());
        default: // cancel
      }
    }
  );
};

export class _Config extends React.Component<ConnectedProps, {}> {
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
      <NB.Container>
        <NB.Header />
        <NB.Content>
          <NB.List>
            <NB.Separator bordered>
              <NB.Text>Basic {isLogin ? `: ${user.displayName}` : ''}</NB.Text>
            </NB.Separator>
            <NB.ListItem icon>
              <NB.Body>
                <NB.Text>Login</NB.Text>
              </NB.Body>
              <NB.Right>
                <NB.Button
                  small
                  onPress={() =>
                    !isLogin ? this.handleLogin() : this.handleLogout()
                  }
                >
                  <NB.Text>{isLogin ? 'Logout' : 'Login'}</NB.Text>
                </NB.Button>
              </NB.Right>
            </NB.ListItem>

            <NB.ListItem icon>
              <NB.Body>
                <NB.Text>Show Mastered Cards</NB.Text>
              </NB.Body>
              <NB.Right>
                <RN.Switch
                  value={config.showMastered}
                  onValueChange={() =>
                    dispatch(
                      Action.config.updateConfig({
                        showMastered: !config.showMastered,
                      })
                    )
                  }
                />
              </NB.Right>
            </NB.ListItem>

            <NB.ListItem icon>
              <NB.Body>
                <NB.Text>Shuffle cards</NB.Text>
              </NB.Body>
              <NB.Right>
                <RN.Switch
                  value={config.shuffled}
                  onValueChange={async () => {
                    await dispatch(
                      Action.config.updateConfig({ shuffled: !config.shuffled })
                    );
                    await dispatch(Action.nav.shuffleCardsOrSort());
                  }}
                />
              </NB.Right>
            </NB.ListItem>

            <NB.ListItem icon>
              <NB.Body>
                <NB.Text>Show header in main screen</NB.Text>
              </NB.Body>
              <NB.Right>
                <RN.Switch
                  value={config.showHeader}
                  onValueChange={async () => {
                    await dispatch(
                      Action.config.updateConfig({
                        showHeader: !config.showHeader,
                      })
                    );
                  }}
                />
              </NB.Right>
            </NB.ListItem>

            <NB.ListItem icon>
              <NB.Body>
                <NB.Text>Hide body when you go to next/prev cards</NB.Text>
              </NB.Body>
              <NB.Right>
                <RN.Switch
                  value={config.hideBodyWhenCardChanged}
                  onValueChange={() =>
                    dispatch(
                      Action.config.updateConfig({
                        hideBodyWhenCardChanged: !config.hideBodyWhenCardChanged,
                      })
                    )
                  }
                />
              </NB.Right>
            </NB.ListItem>

            <NB.ListItem icon>
              <NB.Body>
                <NB.Text>Theme</NB.Text>
              </NB.Body>
              <NB.Right>
                <NB.Picker
                  style={{
                    width: RN.Platform.OS === 'android' ? 120 : undefined,
                  }}
                  selectedValue={config.theme}
                  onValueChange={theme =>
                    dispatch(Action.config.updateConfig({ theme }))
                  }
                  {...{ iosIcon: <NB.Icon name="ios-arrow-down-outline" /> }}
                >
                  {['default', 'dark'].map((x, i) => (
                    <NB.Picker.Item key={i} label={x} value={x} />
                  ))}
                </NB.Picker>
              </NB.Right>
            </NB.ListItem>

            <NB.Separator bordered>
              <NB.Text>Interval: {config.cardInterval}s</NB.Text>
            </NB.Separator>

            <NB.ListItem icon>
              <NB.Body style={{ paddingRight: 10 }}>
                <RN.Slider
                  step={1}
                  value={config.cardInterval}
                  minimumValue={1}
                  maximumValue={30}
                  onSlidingComplete={cardInterval =>
                    dispatch(Action.config.updateConfig({ cardInterval }))
                  }
                  style={{ flex: 1 }}
                />
              </NB.Body>
            </NB.ListItem>

            <NB.Separator bordered>
              <NB.Text>Swipe Gestures</NB.Text>
            </NB.Separator>

            {[
              ['cardSwipeUp', 'up'],
              ['cardSwipeDown', 'down'],
              ['cardSwipeLeft', 'left'],
              ['cardSwipeRight', 'right'],
            ].map(([type, label], i) => (
              <NB.ListItem icon key={i}>
                <NB.Body>
                  <NB.Text>{label}</NB.Text>
                </NB.Body>
                <NB.Right>
                  <NB.Picker
                    style={{
                      width: RN.Platform.OS === 'android' ? 250 : undefined,
                    }}
                    selectedValue={config[type]}
                    onValueChange={v =>
                      dispatch(Action.config.updateConfig({ [type]: v }))
                    }
                    {...{
                      iosIcon: <NB.Icon name="ios-arrow-down-outline" />,
                      textStyle: { color: 'cornflowerblue' },
                    }}
                  >
                    {cardSwipeTypes.map((x, i) => (
                      <NB.Picker.Item key={i} label={x} value={x} />
                    ))}
                  </NB.Picker>
                </NB.Right>
              </NB.ListItem>
            ))}

            <NB.Separator bordered>
              <NB.Text>Developer</NB.Text>
            </NB.Separator>

            <NB.ListItem icon>
              <NB.Body>
                <NB.Text>Git Hash</NB.Text>
              </NB.Body>
              <NB.Right>
                <NB.Text>{C.GIT_HASH.substring(0, 7)}</NB.Text>
              </NB.Right>
            </NB.ListItem>

            <NB.ListItem icon>
              <NB.Body>
                <NB.Text>Version</NB.Text>
              </NB.Body>
              <NB.Right>
                <NB.Text>{this.state.version || ''}</NB.Text>
              </NB.Right>
            </NB.ListItem>

            <NB.ListItem icon>
              <NB.Body>
                <NB.Text>Refresh</NB.Text>
              </NB.Body>
              <NB.Right>
                <RN.TouchableOpacity
                  onPress={() => dispatch(Action.auth.refreshToken())}
                  onLongPress={() => alert(config.googleAccessToken)}
                >
                  <NB.Text>
                    {config.googleAccessToken &&
                      config.googleAccessToken.substring(0, 20)}
                  </NB.Text>
                </RN.TouchableOpacity>
              </NB.Right>
            </NB.ListItem>

            <NB.ListItem icon>
              <NB.Body>
                <NB.Text>App Cache</NB.Text>
              </NB.Body>
              <NB.Right>
                <NB.Button small danger onPress={() => clearAppCache(dispatch)}>
                  <NB.Text>Clear</NB.Text>
                </NB.Button>
              </NB.Right>
            </NB.ListItem>
          </NB.List>
        </NB.Content>
      </NB.Container>
    );
  }
}
export const Config = connect(state => ({ state }))(_Config);