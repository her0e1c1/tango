/**
 * @file Defines the route-level Config Page component.
 * The page is intentionally thin: it mounts the feature container that owns data loading and user
 * actions.
 */

import type React from "react";
import { ConfigContainer } from "@/features/settings/containers";

/**
 * Renders the Config Page route.
 * The page delegates application state and user actions to its feature container.
 */
export const ConfigPage: React.FC = () => <ConfigContainer />;
