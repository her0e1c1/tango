import * as React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import * as Action from 'src/web/action';
import * as Papa from 'papaparse';
import { Icon, Form, Upload, Button, Input, Select } from 'antd';
import { EditCard } from './card';
const FormItem = Form.Item;

class _CsvUpload extends React.Component<
  ConnectedProps & { complete: (name: string, cards: Card[]) => void }
> {
  state = { loading: false };
  componentDidMount() {}
  render() {
    return (
      <Upload
        name="csv-upload"
        listType="picture-card"
        showUploadList={false}
        // beforeUpload={info => {
        //   console.log("DEBUG", info);
        //   return true;
        // }}
        customRequest={() => {}} // prevent complete function from calling 3 times ...
        onChange={info => {
          Papa.parse(info.file.originFileObj, {
            complete: async results => {
              __DEV__ && console.log('DEBUG: CSV COMPLETE', results);
              const name = info.file.name;
              const cards: Card[] = results.data
                .map(Action.rowToCard)
                .filter(c => !!c.frontText);
              this.props.complete(name, cards);
            },
          });
        }}
      >
        <Icon type={this.state.loading ? 'loading' : 'plus'} />
      </Upload>
    );
  }
}
export const CsvUpload = connect(state => ({ state }))(_CsvUpload);

class _DeckCreate extends React.Component<
  ConnectedProps & RouteComponentProps,
  { deckName: string; cards: Card[] }
> {
  state = { deckName: '', cards: [] as Card[] };
  render() {
    return (
      <Form layout="horizontal">
        <FormItem required label="Deck Name">
          <Input
            value={this.state.deckName}
            onChange={e => this.setState({ deckName: e.target.value })}
          />
        </FormItem>
        <FormItem
          label="Import From CSV"
          help="csv file must has at least two columns, front text and back text"
        >
          <CsvUpload
            complete={(deckName, cards) => this.setState({ deckName, cards })}
          />
        </FormItem>
        <FormItem label="Number Of Cards">{this.state.cards.length}</FormItem>
        <FormItem>
          <Button
            type="primary"
            onClick={async () => {
              await this.props.dispatch(
                Action.deckCreate(
                  {
                    name: this.state.deckName,
                    isPublic: false,
                  },
                  this.state.cards
                )
              );
              this.props.history.push('/');
            }}
          >
            Submit
          </Button>
        </FormItem>
      </Form>
    );
  }
}
export const DeckCreate = withRouter(
  connect(state => ({ state }))(_DeckCreate)
);

class _CardCreate extends React.Component<
  ConnectedProps & RouteComponentProps<{ deckId: string }>
> {
  state = { card: {} as Card };
  renderText(key: CardTextKey) {
    const card = this.state.card;
    return (
      <EditCard
        edit={this.state[key]}
        width={100}
        category={card.category}
        text={card[key]}
        onClick={() => this.setState({ [key]: true })}
        onBlur={val =>
          this.setState({
            card: { ...this.state.card, [key]: val },
            [key]: false,
          })
        }
      />
    );
  }
  render() {
    const { deckId } = this.props.match.params;
    const deck = this.props.state.deck.byId[deckId];
    if (!deck) {
      return <div />;
    }
    return (
      <Form>
        <FormItem label="Deck Name">{deck.name}</FormItem>
        <FormItem label="Front Text">{this.renderText('frontText')}</FormItem>
        <FormItem label="Back Text">{this.renderText('backText')}</FormItem>
        <FormItem label="Hint">{this.renderText('hint')}</FormItem>
        <FormItem>
          <Button
            type="primary"
            onClick={async () => {
              await this.props.dispatch(
                Action.cardCreate({ ...this.state.card, deckId })
              );
              this.props.history.push(`/deck/${deckId}`);
            }}
          >
            Submit
          </Button>
        </FormItem>
      </Form>
    );
  }
}

export const CardCreate = withRouter(
  connect(state => ({ state }))(_CardCreate)
);

class _CardEdit extends React.Component<
  ConnectedProps & RouteComponentProps<{ cardId: string }>
> {
  state = { card: {} as Card };
  componentDidMount() {
    this.setState({ card: this.getCard() });
  }
  getCard() {
    const { cardId } = this.props.match.params;
    return this.props.state.card.byId[cardId];
  }
  renderText(key: CardTextKey) {
    const card = this.getCard();
    const deck = this.props.state.deck.byId[card.deckId];
    return (
      <EditCard
        edit={Boolean(this.state[key])}
        width={100}
        category={deck.category}
        text={card[key]}
        onClick={() => this.setState({ [key]: true })}
        onBlur={val =>
          this.setState({
            card: { ...this.state.card, [key]: val },
            [key]: false,
          })
        }
      />
    );
  }
  render() {
    const card = this.getCard();
    return (
      <Form>
        <FormItem label="Deck Name">
          <Select
            defaultValue={card.deckId}
            onSelect={deckId =>
              this.setState({ card: { ...this.state.card, deckId } })
            }
          >
            {Object.values(this.props.state.deck.byId).map(d => (
              <Select.Option value={d.id}>{d.name}</Select.Option>
            ))}
          </Select>
        </FormItem>
        <FormItem label="Front Text">{this.renderText('frontText')}</FormItem>
        <FormItem label="Back Text">{this.renderText('backText')}</FormItem>
        <FormItem label="Hint">{this.renderText('hint')}</FormItem>
        <FormItem>
          <Button
            type="primary"
            onClick={async () => {
              await this.props.dispatch(
                Action.cardUpdate({ ...this.state.card })
              );
              this.props.history.push(`/deck/${card.deckId}`);
            }}
          >
            Submit
          </Button>
        </FormItem>
      </Form>
    );
  }
}

// if call constructor, ts-error
export const CardEdit = withRouter(connect(state => ({ state }))(_CardEdit));
