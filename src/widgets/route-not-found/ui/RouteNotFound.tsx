import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { RouteFeedbackProps } from "@/shared/ui/route-feedback";

import { routes } from "@/shared/router";
import { RouteFeedback } from "@/shared/ui/route-feedback";

export const RouteNotFound = (props: Pick<RouteFeedbackProps, "description" | "title">) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <RouteFeedback
      {...props}
      tone="not-found"
      primaryAction={{ label: t("notFound.goHome"), onClick: () => void navigate(routes.deckList.to()) }}
      secondaryAction={{ label: t("notFound.goBack"), onClick: () => void navigate(-1) }}
    />
  );
};
