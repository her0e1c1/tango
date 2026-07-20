/**
 * @file Defines the route-level Deck Swiper Page component.
 * The page is intentionally thin: it mounts the feature container that owns data loading and user
 * actions.
 */

import type React from "react";

import { DeckSwiperContainer } from "@/features/study/containers";

/**
 * Renders the Deck Swiper Page route.
 * The page delegates application state and user actions to its feature container.
 */
export const DeckSwiperPage: React.FC = () => <DeckSwiperContainer />;
