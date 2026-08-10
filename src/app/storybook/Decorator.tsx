/**
 * @file Provides shared Storybook support for Decorator.
 * Stories reuse this setup to display components with realistic data, providers, and viewport
 * settings.
 */

import type * as React from "react";

/**
 * Renders the Container user interface.
 * Centers Storybook content in the same maximum-width container used for component examples.
 */
export const Container: React.FC<{ children?: React.ReactNode }> = (props) => (
  <div className="container mx-auto">{props.children}</div>
);
