import * as React from 'react';
import { connect } from 'react-redux';
import { Layout, Menu } from 'antd';
import * as Action from 'src/action';
import { Link, withRouter } from 'react-router-dom';

const Logo = () => (
  <Link to="/">
    <div
      style={{
        width: 120,
        height: 50,
        background: '#333',
        borderRadius: 6,
        float: 'left',
      }}
    />
  </Link>
);

class _Header extends React.Component<ConnectedProps> {
  render() {
    return (
      <Layout.Header style={{ background: '#fff', padding: 0, height: 50 }}>
        <Logo />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['1']}
          onClick={({ key, keyPath }) => {
            if (key === '1') {
              if (this.props.state.config.uid) {
                this.props.dispatch(Action.logout());
              } else {
                this.props.dispatch(Action.login());
              }
            } else if (key === '2') {
              this.props.history.push(`/new`);
            }
          }}
        >
          <Menu.Item key="1">
            {this.props.state.config.uid ? 'Logout' : 'Login'}
          </Menu.Item>
          <Menu.Item key="2">NEW</Menu.Item>
        </Menu>
      </Layout.Header>
    );
  }
}

export const Header = withRouter(connect(state => ({ state }))(_Header));