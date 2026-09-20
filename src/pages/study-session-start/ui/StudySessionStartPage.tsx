import type * as React from "react";
import { useTranslation } from "react-i18next";

import { RouteNotFound } from "@/widgets/route-not-found";

import { useStudySessionStartRouteModel } from "../model/useStudySessionStartPageModel";
import { StudySessionStartContainer } from "./StudySessionStartContainer";

export const StudySessionStartPage: React.FC = () => {
  const { t } = useTranslation();
  const { deckId, deck } = useStudySessionStartRouteModel();

  if (deck == null) {
    return (
      <RouteNotFound
        title={t("studyStart.deckNotFound.title")}
        description={t("studyStart.deckNotFound.description")}
      />
    );
  }

  // Session setup state belongs to one route Deck and must reset when the id changes.
  return <StudySessionStartContainer key={deckId} deck={deck} />;
};
