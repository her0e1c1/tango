import { useNavigate } from "react-router-dom";

import type { RouteFeedbackProps } from "@/shared/ui/route-feedback";

import { routes } from "@/shared/router";
import { RouteFeedback } from "@/shared/ui/route-feedback";

export const RouteNotFound = (props: Pick<RouteFeedbackProps, "description" | "title">) => {
  const navigate = useNavigate();
  return (
    <RouteFeedback
      {...props}
      tone="not-found"
      primaryAction={{ label: "Go home", onClick: () => void navigate(routes.deckList.to()) }}
      secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
    />
  );
};
