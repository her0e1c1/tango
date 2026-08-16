import type * as React from "react";

import { useCard } from "@/entities/card";
import { useDeck } from "@/entities/deck";
import { routes, useNavigation } from "@/features/navigate";
import { RouteFeedback } from "@/shared/ui/route-feedback";

interface RouteEntityBoundaryProps {
  children: React.ReactNode;
  entity: "Card" | "Deck";
  id: string;
  title?: string;
}

const MissingRouteEntity = ({ entity, title }: Pick<RouteEntityBoundaryProps, "entity"> & { title: string }) => {
  const navigation = useNavigation();
  return (
    <RouteFeedback
      title={title}
      description={`The requested ${entity.toLowerCase()} is unavailable or has been removed.`}
      tone="not-found"
      primaryAction={{ label: "Go home", onClick: () => void navigation.to(routes.deckList.to()) }}
      secondaryAction={{ label: "Go back", onClick: () => void navigation.back() }}
    />
  );
};

// Mount Feature hooks only after the route Entity graph exists, keeping absence out of normal Feature state.
export const RouteEntityBoundary = ({
  children,
  entity,
  id,
  title = `${entity} not found`,
}: RouteEntityBoundaryProps) => {
  const card = useCard(entity === "Card" ? id : undefined);
  const deck = useDeck(entity === "Card" ? card?.deckId : id);
  const exists = deck != null && (entity === "Deck" || card != null);
  return exists ? children : <MissingRouteEntity entity={entity} title={title} />;
};
