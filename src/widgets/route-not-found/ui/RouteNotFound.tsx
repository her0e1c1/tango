import type { RouteFeedbackProps } from "@/shared/ui/route-feedback";

import { routes, useNavigation } from "@/shared/router";
import { RouteFeedback } from "@/shared/ui/route-feedback";

export const RouteNotFound = (props: Pick<RouteFeedbackProps, "description" | "title">) => {
  const navigation = useNavigation();
  return (
    <RouteFeedback
      {...props}
      tone="not-found"
      primaryAction={{ label: "Go home", onClick: () => void navigation.to(routes.deckList.to()) }}
      secondaryAction={{ label: "Go back", onClick: () => void navigation.back() }}
    />
  );
};
