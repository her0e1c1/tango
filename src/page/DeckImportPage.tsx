/**
 * @file Defines the route-level Deck Import Page component.
 * The page is intentionally thin: it mounts the feature container that owns data loading and user
 * actions.
 */

import type React from "react";
import { DeckImportContainer } from "@/features/import/containers";

/**
 * Renders the Deck Import Page route.
 * The page delegates application state and user actions to its feature container.
 */
export const DeckImportPage: React.FC = () => <DeckImportContainer />;
