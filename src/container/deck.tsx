import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Redux from 'redux';

export default class Deck extends React.Component {
  render() {
    return (
      <RN.View
        style={{
          flex: 1,
          alignItems: 'stretch',
          justifyContent: 'center',
          backgroundColor: 'green',
        }}
      >
        <RN.FlatList
          data={[].map((p, i) => ({ ...p, key: i }))}
          renderItem={({ item }) => (
            <RN.TouchableOpacity
              onPress={() => this.props.navigation.navigate(String(item.key))}
            >
              <RN.View
                style={{
                  backgroundColor: 'blue',
                  borderStyle: 'solid',
                  borderWidth: 1,
                  alignItems: 'center',
                }}
              >
                <RN.Button
                  color="red"
                  key={item.key}
                  onPress={() =>
                    this.props.navigation.navigate(String(item.title))
                  }
                  title={String(item.title)}
                />
              </RN.View>
            </RN.TouchableOpacity>
          )}
        />
      </RN.View>
    );
  }
}
