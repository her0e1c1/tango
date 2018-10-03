import * as React from 'react';
import { connect } from 'react-redux';
import { Table, Input, Icon, Select } from 'antd';
import { ColumnProps } from 'antd/lib/table/interface';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import * as Action from 'src/web/action';
import * as katex from 'katex';

export class MathView extends React.Component<{ text: string }> {
  convert(text: string) {
    // TODO: remove because of my case only
    text = text.replace(/eqnarray/g, 'aligned');
    text = text.replace(/&=&/g, '&=');
    text = text.replace(/&&/g, '&');
    text = text.replace(/\\rm/g, '\\text');

    // NOTE: . does not match \n. need to use [\s\S] instead
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, x) => {
      return katex.renderToString(x.replace(/\s/g, ' '), {
        displayMode: true,
        throwOnError: false,
      });
    });
    text = text.replace(/\$([\s\S]*?)\$/g, (_, x) => {
      return katex.renderToString(x, {
        displayMode: false,
        throwOnError: false,
      });
    });
    return text;
  }
  render() {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: this.convert(this.props.text) }}
      />
    );
  }
}

class _CardList extends React.Component<
  ConnectedProps & RouteComponentProps<{ deckId: string }>
> {
  columns: ColumnProps<Card>[];
  state = { editFrontTextId: '', editBackTextId: '' };
  componentDidMount() {
    const deck =
      this.props.state.deck.byId[this.props.match.params.deckId] || {};
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
            ) : deck.category === 'math' ? (
              <MathView text={card.frontText} />
            ) : (
              card.frontText
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
            ) : deck.category === 'math' ? (
              <MathView text={card.backText} />
            ) : (
              card.backText
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
            onChange={(tags: string[]) =>
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
    const { deckId } = this.props.match.params;
    this.props.dispatch(Action.cardFetch(deckId));
  }
  render() {
    const { deckId } = this.props.match.params;
    const data = Object.values(this.props.state.card.byId).filter(
      c => deckId === c.deckId
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
