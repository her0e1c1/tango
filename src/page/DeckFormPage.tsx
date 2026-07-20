/**
 * @file Defines the route-level Deck Form Page component.
 * The page is intentionally thin: it mounts the feature container that owns data loading and user
 * actions.
 */

import { DeckFormContainer } from "@/features/deck/containers";

/**
 * Renders the Deck Form Page route.
 * The page delegates application state and user actions to its feature container.
 */
export const DeckFormPage = () => <DeckFormContainer />;
