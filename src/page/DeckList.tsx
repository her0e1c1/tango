/**
 * @file Defines the route-level Deck List component.
 * The page is intentionally thin: it mounts the feature container that owns data loading and user
 * actions.
 */

import { DeckListContainer } from "@/features/deck/containers";

/**
 * Renders the Deck List Page route.
 * The page delegates application state and user actions to its feature container.
 */
export const DeckListPage = () => <DeckListContainer />;
