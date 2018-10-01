import * as Action from 'src/react-native/action';
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
    async index => {
      if (index === 0) {
        await dispatch(Action.clearAll(true));
      } else if (index === 1) {
        await dispatch(Action.clearAll());
      } else if (index === 2) {
        await dispatch(Action.drop());
      } else {
        // DO NOTHING
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
        onPress: () => dispatch(Action.loginWithFacebook()),
      },
      {
        text: 'Google',
        onPress: () => dispatch(Action.loginWithGoogle()),
      },
      { text: 'Cancel', onPress: () => {} },
    ]);
  }

  handleLogout() {
    const { dispatch } = this.props;
    RN.Alert.alert('Do you want to logout?', '', [
      {
        text: 'Logout',
        onPress: () => dispatch(Action.logout()),
      },
      { text: 'Cancel', onPress: () => {} },
    ]);
  }

  render() {
    const { dispatch } = this.props;
    const { config } = this.props.state;
    const isLogin = config && !!config.uid;
    return (
      <NB.Container>
        <NB.Header>
          <NB.Body>
            <NB.Title>Settings</NB.Title>
          </NB.Body>
        </NB.Header>
        <NB.Content>
          <NB.List>
            <NB.Separator bordered>
              <NB.Text>
                Basic {isLogin ? `: ${config.displayName}` : ''}
              </NB.Text>
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
                      Action.configUpdate({
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
                      Action.configUpdate({ shuffled: !config.shuffled })
                    );
                    await dispatch(Action.shuffleCardsOrSort());
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
                      Action.configUpdate({
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
                      Action.configUpdate({
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
                    dispatch(Action.configUpdate({ theme }))
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
                    dispatch(Action.configUpdate({ cardInterval }))
                  }
                  style={{ flex: 1 }}
                />
              </NB.Body>
            </NB.ListItem>

            <NB.Separator bordered>
              <NB.Text>Swipe Gestures</NB.Text>
            </NB.Separator>

            {[
              ['cardSwipeUp', '↑'],
              ['cardSwipeDown', '↓'],
              ['cardSwipeLeft', '←'],
              ['cardSwipeRight', '→'],
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
                      dispatch(Action.configUpdate({ [type]: v }))
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
                  onPress={() => dispatch(Action.refreshToken())}
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
