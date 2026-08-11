/**
 * @file Defines the reusable Form component in the shared form library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import type React from "react";

/**
 * Renders the Form user interface.
 * Provides shared form spacing and renders either a real form with submit handling or a non-form
 * div wrapper.
 */
export const Form: React.FC<{ div?: boolean; onSubmit?: () => void; children?: React.ReactNode }> = (props) => {
  const { div, ...rest } = props;
  const Tag = div ? "div" : "form";
  return <Tag className="w-full space-y-4 px-3 text-ink" {...rest} />;
};
