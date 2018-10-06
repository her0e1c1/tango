import * as React from 'react';
import { connect } from 'react-redux';
import { Row, Col, Card } from 'antd';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import * as Action from 'src/web/action';
import { MathView } from './card';

class _CardOrder extends React.Component<
  ConnectedProps & RouteComponentProps<{ deckId: string }>,
  { cardIds: string[] }
> {
  deck: Deck;
  constructor(props) {
    super(props);
    const { deckId } = this.props.match.params;
    this.deck = this.props.state.deck.byId[deckId];
    this.state = { cardIds: this.deck.cardIds };
  }
  getCards() {
    const cardIds = this.state.cardIds || [];
    return cardIds.map(id => this.props.state.card.byId[id]).filter(c => !!c);
  }
  async componentDidMount() {
    await this.props.dispatch(Action.cardFetch(this.deck.id));
    this.setState({ cardIds: this.getCards().map(c => c.id) });
  }
  reorder(startIndex, endIndex) {
    const result = Array.from(this.state.cardIds);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    this.setState({ cardIds: result }, () =>
      this.props.dispatch(Action.deckUpdate({ ...this.deck, cardIds: result }))
    );
  }
  render() {
    return (
      <div>
        <DragDropContext
          onDragEnd={result => {
            if (result.destination) {
              this.reorder(result.source.index, result.destination.index);
            }
          }}
        >
          <Droppable droppableId="droppable">
            {(provided, _snapshot) => (
              <div ref={provided.innerRef}>
                {this.getCards().map((card, index) => (
                  <Draggable key={card.id} draggableId={card.id} index={index}>
                    {(provided, _snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Card style={{ height: '10vh', overflow: 'hidden' }}>
                          <Row type="flex">
                            <Col span={1}>{index + 1}</Col>
                            <Col span={23}>
                              <MathView text={card.frontText} />
                            </Col>
                          </Row>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }
}

export const CardOrder = withRouter(connect(state => ({ state }))(_CardOrder));
