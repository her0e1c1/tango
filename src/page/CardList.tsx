/**
 * @file Defines the route-level Card List component.
 * The page is intentionally thin: it mounts the feature container that owns data loading and user
 * actions.
 */

import type React from "react";

import { CardListContainer } from "@/features/card/containers";

/**
 * Renders the Card List Page route.
 * The page delegates application state and user actions to its feature container.
 */
export const CardListPage: React.FC = () => <CardListContainer />;
