import * as React from 'react';
import { connect } from 'react-redux';
import { Table, Input, Icon, Select } from 'antd';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import * as Action from 'src/web/action';

var Latex = require('react-latex'); // TODO: Create a parser

const renderMath = text => <Latex>{text}</Latex>;

class _CardList extends React.Component<
  ConnectedProps & RouteComponentProps<{ id: string }>
> {
  state = { editFrontTextId: '', editBackTextId: '' };
  componentDidMount() {
    this.columns = [
      {
        title: 'Front Text',
        render: (card: Card) => (
          <div
            style={{ width: '40vw', overflow: 'hidden' }}
            onClick={() => this.setState({ editFrontTextId: card.id })}
          >
            {card.id === this.state.editFrontTextId ? (
              <Input.TextArea
                style={{ height: 200 }}
                value={card.frontText}
                ref={i => i && i.focus()}
                onBlur={() => {
                  this.setState({ editFrontTextId: '' });
                  this.props.dispatch(Action.cardUpdate(card));
                }}
                onChange={e =>
                  this.props.dispatch(
                    Action.cardBulkInsert([
                      { ...card, frontText: e.target.value },
                    ])
                  )
                }
              />
            ) : (
              renderMath(card.frontText)
            )}
          </div>
        ),
      },
      {
        title: 'Back Text',
        render: (card: Card) => (
          <div
            style={{ width: '40vw', overflow: 'hidden' }}
            onClick={() => this.setState({ editBackTextId: card.id })}
          >
            {card.id === this.state.editBackTextId ? (
              <Input.TextArea
                style={{ height: 200 }}
                value={card.backText}
                ref={i => i && i.focus()}
                onBlur={() => {
                  this.setState({ editBackTextId: '' });
                  this.props.dispatch(Action.cardUpdate(card));
                }}
                onChange={e =>
                  this.props.dispatch(
                    Action.cardBulkInsert([
                      { ...card, backText: e.target.value },
                    ])
                  )
                }
              />
            ) : (
              renderMath(card.backText)
            )}
          </div>
        ),
      },
      {
        title: 'tags',
        render: (card: Card) => (
          <Select
            mode="tags"
            size="small"
            defaultValue={card.tags}
            onChange={tags =>
              this.props.dispatch(Action.cardUpdate({ ...card, tags }))
            }
          />
        ),
      },
      {
        title: 'delete',
        render: (card: Card) => (
          <Icon
            type="delete"
            onClick={() => this.props.dispatch(Action.cardDelete(card.id))}
          />
        ),
      },
    ];
    const { id } = this.props.match.params;
    this.props.dispatch(Action.cardFetch(id));
  }
  render() {
    const { id } = this.props.match.params;
    const data = Object.values(this.props.state.card.byId).filter(
      c => id === c.deckId
    );
    return (
      <div>
        <Table
          rowKey="id"
          dataSource={data}
          columns={this.columns}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ['10', '50', '100'],
          }}
        />
      </div>
    );
  }
}

export const CardList = withRouter(connect(state => ({ state }))(_CardList));
