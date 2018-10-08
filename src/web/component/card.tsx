import * as React from 'react';
import { connect } from 'react-redux';
import { Table, Input, Icon, Select, Checkbox } from 'antd';
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
  state = {
    editFrontTextId: '',
    editBackTextId: '',
    editHintId: '',
    columns: ['frontText', 'backText', 'hint'] as CardText[],
  };
  getText(card: Card, text: CardText, stateKey: string) {
    const deck =
      this.props.state.deck.byId[this.props.match.params.deckId] || {};
    const width = 81 / this.state.columns.length;
    return (
      <div
        style={{ width: `${width}vw`, overflow: 'hidden', minHeight: 100 }}
        onClick={() => this.setState({ [stateKey]: card.id })}
      >
        {card.id === this.state[stateKey] ? (
          <Input.TextArea
            style={{ height: 200 }}
            value={card[text]}
            ref={i => i && i.focus()}
            onBlur={() => {
              this.setState({ [stateKey]: '' });
              this.props.dispatch(Action.cardUpdate(card));
            }}
            onChange={e =>
              this.props.dispatch(
                Action.cardBulkInsert([{ ...card, [text]: e.target.value }])
              )
            }
          />
        ) : deck.category === 'math' ? (
          <MathView text={card[text]} />
        ) : (
          card[text]
        )}
      </div>
    );
  }

  getColumns() {
    const columns = [] as ColumnProps<Card>[];
    if (this.state.columns.includes('frontText')) {
      columns.push({
        title: 'Front Text',
        render: (card: Card) =>
          this.getText(card, 'frontText', 'editFrontTextId'),
      });
    }
    if (this.state.columns.includes('backText')) {
      columns.push({
        title: 'Back Text',
        render: (card: Card) =>
          this.getText(card, 'backText', 'editBackTextId'),
      });
    }
    if (this.state.columns.includes('hint')) {
      columns.push({
        title: 'Hint',
        render: (card: Card) => this.getText(card, 'hint', 'editHintId'),
      });
    }
    columns.push({
      title: 'Action',
      render: (card: Card) => (
        <div
          style={{
            width: '10vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <Select
            mode="tags"
            size="small"
            defaultValue={card.tags}
            onChange={(tags: string[]) =>
              this.props.dispatch(Action.cardUpdate({ ...card, tags }))
            }
          />
          <Icon
            type="delete"
            onClick={() => this.props.dispatch(Action.cardDelete(card.id))}
          />
        </div>
      ),
    });
    return columns;
  }
  render() {
    const { deckId } = this.props.match.params;
    const deck = this.props.state.deck.byId[deckId];
    const cards = deck.cardIds
      .map(id => this.props.state.card.byId[id])
      .filter(
        c =>
          this.props.state.config.selectedTags.length === 0 ||
          this.props.state.config.selectedTags.some(t => c.tags.includes(t))
      );
    return (
      <div>
        <Checkbox.Group
          options={['frontText', 'backText', 'hint']}
          defaultValue={this.state.columns}
          onChange={columns => this.setState({ columns })}
        />
        <Select
          style={{ width: 500 }}
          mode="tags"
          defaultValue={this.props.state.config.selectedTags}
          onChange={(selectedTags: string[]) =>
            this.props.dispatch(Action.configUpdate({ selectedTags }))
          }
        >
          {this.props.state.card.tags.map(t => (
            <Select.Option value={t}>{t}</Select.Option>
          ))}
        </Select>
        <Table
          rowKey="id"
          dataSource={cards}
          columns={this.getColumns()}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100'],
          }}
        />
      </div>
    );
  }
}

export const CardList = withRouter(connect(state => ({ state }))(_CardList));
