import * as React from 'react';
import { connect } from 'react-redux';
import { Table, Input, Icon, Select, Checkbox, Button, Popconfirm } from 'antd';
import { ColumnProps } from 'antd/lib/table/interface';
import { withRouter, RouteComponentProps, Link } from 'react-router-dom';
import Highlight from 'react-highlight';
import { getSelector } from 'src/selector';
import * as katex from 'katex';
import * as C from 'src/constant';
import * as Action from 'src/web/action';
import 'highlight.js/styles/googlecode.css';
import { deck } from 'src/store/reducer';

export const renderCard = (data: string, category?: string | null) => {
  if (category === 'math') {
    return <MathView text={data || ''} />;
  } else if (C.LANGUAGES.includes(category || '')) {
    return <Highlight className={category}>{data}</Highlight>;
  } else {
    return data;
  }
};

const styleMath = {
  fontSize: 18,
  tabSize: 2,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  letterSpacing: 0,
  // need, otherwise flex area can not be expanded
  minHeight: '100vh',
  minWidth: '100vw',
  // flexWrap: 'nowrap',
};
const styleCode = {
  fontSize: 18,
  tabSize: 2,
  margin: '0 auto',
};

export const renderView = (data: string, category: string | null) => (
  <div style={C.LANGUAGES.includes(category || '') ? styleCode : styleMath}>
    {renderCard(data, category)}
  </div>
);

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

export class EditCard extends React.Component<
  {
    text: string;
    edit: boolean;
    width: number;
    category?: string;
    onClick: () => void;
    onBlur: (text: string) => void;
  },
  { text: string }
> {
  constructor(props) {
    super(props);
    this.state = { text: this.props.text || '' };
  }
  render() {
    const text = this.state.text;
    return (
      <div
        style={{
          width: `${this.props.width}vw`,
          overflow: 'hidden',
          minHeight: 100,
        }}
        onClick={this.props.onClick}
      >
        {this.props.edit ? (
          <Input.TextArea
            style={{ height: 200 }}
            value={this.state.text}
            ref={i => i && i.focus()}
            onBlur={() => this.props.onBlur(this.state.text)}
            onChange={e => this.setState({ text: e.target.value })}
          />
        ) : (
          renderCard(text, this.props.category)
        )}
      </div>
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
    columns: ['frontText', 'backText'] as CardTextKey[],
  };
  getText(card: CardModel, text: CardTextKey, stateKey: string) {
    const width = 81 / this.state.columns.length;
    return (
      <EditCard
        edit={card.id == this.state[stateKey]}
        text={card[text]}
        width={width}
        category={card.category}
        onClick={() => this.setState({ [stateKey]: card.id })}
        onBlur={value => {
          this.setState({ [stateKey]: '' });
          this.props.dispatch(Action.cardUpdate({ ...card, [text]: value }));
        }}
      />
    );
  }

  getColumns() {
    const columns = [] as ColumnProps<Card>[];
    if (this.state.columns.includes('frontText')) {
      columns.push({
        title: 'Front Text',
        render: (card: CardModel) =>
          this.getText(card, 'frontText', 'editFrontTextId'),
      });
    }
    if (this.state.columns.includes('backText')) {
      columns.push({
        title: 'Back Text',
        render: (card: CardModel) =>
          this.getText(card, 'backText', 'editBackTextId'),
      });
    }
    if (this.state.columns.includes('hint')) {
      columns.push({
        title: 'Hint',
        render: (card: CardModel) => this.getText(card, 'hint', 'editHintId'),
      });
    }
    columns.push({
      title: 'Action',
      width: 120,
      render: (card: CardModel) => (
        <div
          style={{
            width: '10vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex' }}>
            <Link to={`/card/${card.id}/view/backText`} target="_blank">
              <Icon type="file" />
            </Link>
            <Link to={`/card/${card.id}/edit`} target="_blank">
              <Icon type="edit" />
            </Link>
            <Popconfirm
              title="Are you sur?"
              onConfirm={() => this.props.dispatch(Action.cardDelete(card.id))}
            >
              <Icon type="delete" />
            </Popconfirm>
          </div>
          <Select
            style={{ width: 120 }}
            mode="tags"
            size="small"
            defaultValue={card.tags}
            onChange={(tags: string[]) =>
              this.props.dispatch(Action.cardUpdate({ ...card, tags }))
            }
          />
        </div>
      ),
    });
    return columns;
  }
  render() {
    const { deckId } = this.props.match.params;
    return (
      <div>
        <Button
          onClick={() => this.props.history.push(`/deck/${deckId}/new`)}
          type="primary"
          style={{ marginTop: 5 }}
        >
          Add a card
        </Button>
        <div />
        <Checkbox.Group
          options={['frontText', 'backText', 'hint']}
          defaultValue={this.state.columns}
          onChange={columns => this.setState({ columns })}
        />
        <Select
          style={{ width: 500 }}
          mode="tags"
          onChange={(selectedTags: string[]) =>
            this.props.dispatch(
              Action.deckInsert({ id: deckId, selectedTags } as Deck)
            )
          }
        >
          {this.props.state.card.tags.map(t => (
            <Select.Option value={t}>{t}</Select.Option>
          ))}
        </Select>
        <Table
          rowKey="id"
          dataSource={getSelector(this.props.state).card.filter(deckId)}
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

class _CardView extends React.Component<
  ConnectedProps & RouteComponentProps<{ cardId: string; key: CardTextKey }>
> {
  iframe: HTMLIFrameElement | null;
  render() {
    const { cardId, key } = this.props.match.params;
    const card = getSelector(this.props.state).card.getByIdOrEmpty(cardId);
    const origin = 'http://localhost:8090';
    // const origin = 'https://tang04mem0.firebaseapp.com';
    return (
      <iframe
        ref={r => (this.iframe = r)}
        src={`${origin}/view?category=${card.category}`}
        style={{ width: '100vw', height: '100vh' }}
        onLoad={() =>
          this.iframe!.contentWindow!.postMessage(
            JSON.stringify({ text: card[key] }),
            origin
          )
        }
      />
    );
  }
}
export const CardView = withRouter(connect(state => ({ state }))(_CardView));
