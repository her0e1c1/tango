import { documentId, getDocument, listDocuments, type StudySessionFixture } from "./fixtures";

export const readProgress = async (cardId: string) => {
  const card = await getDocument("card", cardId);
  return { reps: Number(card?.fields.fsrs?.mapValue?.fields?.reps?.integerValue ?? 0) };
};

// Only linked-user sessions can be observed through the emulator. Anonymous tests use the Study UI.
export const readSession = async (uid: string, deckId: string): Promise<StudySessionFixture | undefined> => {
  const documents = await listDocuments("studySession");
  const session = documents.find(
    ({ fields }) =>
      fields.uid?.stringValue === uid && fields.deckId?.stringValue === deckId && fields.endReason?.nullValue === null
  );
  if (!session) return;
  return {
    sessionId: documentId(session),
    deckId,
    cardOrderIds: session.fields.cardOrderIds?.arrayValue?.values?.map((value) => String(value.stringValue)) ?? [],
    currentIndex: Number(session.fields.currentIndex?.integerValue),
    lastStudiedAt: Date.parse(session.fields.updatedAt?.timestampValue ?? ""),
  };
};
