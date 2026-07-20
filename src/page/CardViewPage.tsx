/**
 * @file Defines the route-level Card View Page component.
 * The page is intentionally thin: it mounts the feature container that owns data loading and user
 * actions.
 */

import type React from "react";

import { CardViewContainer } from "@/features/card/containers";

/**
 * Renders the Card View Page route.
 * The page delegates application state and user actions to its feature container.
 */
export const CardViewPage: React.FC = () => <CardViewContainer />;
