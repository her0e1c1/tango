import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteFeedback } from "@/shared/ui/route-feedback";

import { useStudySessionRouteModel } from "../model/useStudySessionPageModel";
import { StudySessionContainer } from "./StudySessionContainer";

export const StudySessionPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const { deckId, deck } = useStudySessionRouteModel(params.id);

  // Study lifecycle mutates session state, so an unavailable route Deck must not mount it.
  if (deck == null) return <RouteFeedback title={t("studySession.unavailable")} tone="not-found" />;

  // Study state belongs to one route Deck, so id changes start a fresh Page lifecycle.
  return <StudySessionContainer key={deckId} deckId={deckId} />;
};
