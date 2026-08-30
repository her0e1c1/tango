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
export const Form: React.FC<{
  div?: boolean;
  onSubmit?: React.SubmitEventHandler<HTMLFormElement>;
  children?: React.ReactNode;
}> = (props) => {
  const { children, div, onSubmit } = props;
  const className = "w-full space-y-4 px-3 text-ink";
  if (div) return <div className={className}>{children}</div>;
  return (
    <form className={className} onSubmit={onSubmit}>
      {children}
    </form>
  );
};
