/**
 * @file Defines the route-level Card Form Page component.
 * The page is intentionally thin: it mounts the feature container that owns data loading and user
 * actions.
 */

import type React from "react";

import { CardFormContainer } from "@/features/card/containers";

/**
 * Renders the Card Form Page route.
 * The page delegates application state and user actions to its feature container.
 */
export const CardFormPage: React.FC = () => <CardFormContainer />;
