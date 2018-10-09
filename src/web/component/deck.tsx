import * as React from 'react';
import { connect } from 'react-redux';
import { Table, Icon, AutoComplete, Popconfirm, Switch } from 'antd';
import { ColumnProps } from 'antd/lib/table/interface';
import * as Action from 'src/web/action';
import { Link } from 'react-router-dom';

class _DeckCategory extends React.Component<ConnectedProps & { deck: Deck }> {
  state = { input: '' };
  render() {
    const deck: Deck = this.props.deck;
    let categories = this.props.state.deck.categories;
    const { input } = this.state;
    if (input && !categories.includes(input)) {
      categories = [input].concat(categories);
    }
    return (
      <AutoComplete
        style={{ width: 200 }}
        value={this.state.input || deck.category}
        defaultValue={deck.category}
        dataSource={categories}
        onSelect={(category: string) =>
          this.setState({ input: '' }, () =>
            this.props.dispatch(Action.deckUpdate({ ...deck, category }))
          )
        }
        onChange={e => this.setState({ input: e })}
      />
    );
  }
}
export const DeckCategory = connect(state => ({ state }))(_DeckCategory);

class _DeckList extends React.Component<ConnectedProps> {
  columns: ColumnProps<Deck>[];
  state = { loading: true };
  async componentDidMount() {
    this.columns = [
      {
        title: 'name',
        dataIndex: 'name',
        render: (name, deck) => (
          <div>
            <Link to={`/deck/${deck.id}`}>{name}</Link>
            <Icon type="edit" />
          </div>
        ),
      },
      {
        title: 'order',
        render: deck => <Link to={`/deck/${deck.id}/order`}>order</Link>,
      },
      {
        title: 'number',
        render: (deck: Deck) => deck.cardIds.length,
      },
      {
        title: 'category',
        render: (deck: Deck) => <DeckCategory deck={deck} />,
      },
      {
        title: 'publish',
        render: (deck: Deck) => (
          <Switch
            checked={deck.isPublic}
            onChange={isPublic =>
              this.props.dispatch(Action.deckUpdate({ ...deck, isPublic }))
            }
          />
        ),
      },
      {
        title: 'delete',
        dataIndex: 'id',
        render: id => (
          <Popconfirm
            title="Are you sure?"
            onConfirm={() => this.props.dispatch(Action.deckDelete(id))}
          >
            <Icon type="delete" />
          </Popconfirm>
        ),
      },
      {
        title: 'download',
        render: (deck: Deck) => (
          <Icon
            type="download"
            onClick={() => this.props.dispatch(Action.deckDownload(deck.id))}
          />
        ),
      },
    ];

    this.setState({ loading: false });
  }
  render() {
    const data = Object.values(this.props.state.deck.byId);
    return (
      <Table
        rowKey="id"
        loading={this.state.loading}
        dataSource={data}
        columns={this.columns}
      />
    );
  }
}

export const DeckList = connect(state => ({ state }))(_DeckList);
