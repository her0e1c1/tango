import * as React from 'react';
import * as NB from 'native-base';
import { useSelector } from 'react-redux';
import { TextItem, Button, Field, Separator } from 'src/react-native/component';
import { useGoBack } from 'src/react-native/hooks/action';
import { useCurrentCard } from 'src/hooks/state';
import { useCardEdit } from 'src/react-native/hooks/action';
import { Header } from './Common';
import * as action from 'src/react-native/action';
import { useDispatch, useThunkAction } from 'src/hooks';

function useEdit<T extends keyof Card>(key: T) {
  return useSelector(state => state.card.edit[key]);
}

const IDItem = () => {
  const v = useEdit('id');
  return <TextItem noBorder body="ID" right={v} />;
};

const ScoreItem = () => {
  const v = useEdit('score');
  return <TextItem noBorder body="Score" right={String(v)} />;
};

const TagsItem = () => {
  const v = useEdit('tags') || [];
  return <TextItem noBorder body="Tags" right={v.join(', ')} />;
};

const DeleteCard = () => {
  const id = useEdit('id');
  return (
    <Button
      danger
      full
      text="DELETE"
      onPress={useThunkAction(action.cardDelete(id))}
    />
  );
};

const FrontTextField = () => {
  const v = useEdit('frontText');
  const cardEdit = useCardEdit();
  return (
    <Field
      name="Front Text"
      value={v}
      onChangeText={frontText => cardEdit({ frontText })}
    />
  );
};
const BackTextField = () => {
  const v = useEdit('backText');
  const cardEdit = useCardEdit();
  return (
    <Field
      name="Back Text"
      value={v}
      onChangeText={backText => cardEdit({ backText })}
    />
  );
};
const HintField = () => {
  const v = useEdit('backText');
  const cardEdit = useCardEdit();
  return (
    <Field name="Hint" value={v} onChangeText={hint => cardEdit({ hint })} />
  );
};

export const CardEdit = () => (
  <>
    <NB.List>
      <Separator />
      <IDItem />
      <ScoreItem />
      <TagsItem />
    </NB.List>
    <NB.Form>
      <FrontTextField />
      <BackTextField />
      <HintField />
    </NB.Form>
    <DeleteCard />
  </>
);

export const CardEditPage = () => {
  const dispatch = useDispatch();
  const goBack = useGoBack();
  const card = useCurrentCard();
  const cardEdit = useCardEdit();
  React.useEffect(() => {
    cardEdit(card);
  }, []);
  return (
    <NB.Container>
      <Header
        body={{ title: '' }}
        right={{
          icon: 'save',
          onPress: React.useCallback(() => {
            dispatch(action.cardEditUpdate());
            goBack();
          }, []),
        }}
      />
      <NB.Content>
        <CardEdit />
        <NB.Footer />
      </NB.Content>
    </NB.Container>
  );
};
