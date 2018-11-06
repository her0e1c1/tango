import * as React from 'react';
import { connect } from 'react-redux';
import { Table, Icon } from 'antd';
import * as Action from 'src/web/action';
import { getSelector } from 'src/selector';

class _PublicDeckList extends React.Component<ConnectedProps> {
  state = { loading: true };
  getColumns() {
    const columns = [
      {
        title: 'name',
        dataIndex: 'name',
        render: (name, deck) => <div>{name}</div>,
      },
      {
        title: 'download',
        render: (deck: Deck) => (
          <Icon
            type="download"
            onClick={() =>
              this.props.dispatch(
                Action.deckDownload(deck.id, { public: true })
              )
            }
          />
        ),
      },
    ];
    if (this.props.state.config.uid) {
      columns.push({
        title: 'import',
        render: (deck: Deck) => (
          <Icon
            type="plus"
            onClick={() =>
              this.props.dispatch(Action.deckImportPublic(deck.id))
            }
          />
        ),
      });
    }
    return columns;
  }
  async componentDidMount() {
    await this.props.dispatch(Action.deckFetch({ isPublic: true }));
    this.setState({ loading: false });
  }
  render() {
    return (
      <Table
        rowKey="id"
        loading={this.state.loading}
        dataSource={getSelector(this.props.state).deck.public}
        columns={this.getColumns()}
      />
    );
  }
}

export const PublicDeckList = connect(state => ({ state }))(_PublicDeckList);
