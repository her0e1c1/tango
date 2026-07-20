/**
 * @file Defines the route-level Deck Start Page component.
 * The page is intentionally thin: it mounts the feature container that owns data loading and user
 * actions.
 */

import type React from "react";

import { DeckStartContainer } from "@/features/study/containers";

/**
 * Renders the Deck Start Page route.
 * The page delegates application state and user actions to its feature container.
 */
export const DeckStartPage: React.FC = () => <DeckStartContainer />;
