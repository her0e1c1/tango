import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as Papa from 'papaparse';
import { Icon, Form, Upload, Button, Input } from 'antd';
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
                .map(d => ({
                  frontText: d[0] || '',
                  backText: d[1] || '',
                  hint: d[2] || '',
                  tags: [],
                }))
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

class _DeckCreate extends React.Component<ConnectedProps> {
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
