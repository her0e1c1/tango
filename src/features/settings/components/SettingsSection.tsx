/**
 * @file Defines the settings feature's Settings Section presentation component.
 * The component renders props and reports user intent through callbacks while data access stays
 * outside the view.
 */

import * as React from "react";

export interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Renders the Settings Section user interface.
 * Groups related settings under an accessible heading with a title, description, icon, and child
 * controls.
 */
export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, icon, children }) => {
  const headingId = React.useId();

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-surface border border-border bg-surface shadow-surface"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-control bg-surface-muted text-accent-primary"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2 id={headingId} className="text-body font-bold text-ink">
            {title}
          </h2>
          <p className="text-caption text-ink-muted">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-border border-t border-border">{children}</div>
    </section>
  );
};

export interface SettingsRowProps {
  inputId: string;
  label: string;
  description: string;
  children: React.ReactNode;
}

/**
 * Renders the Settings Row user interface.
 * Pairs one setting control with its linked label and optional explanatory description.
 */
export const SettingsRow: React.FC<SettingsRowProps> = ({ inputId, label, description, children }) => (
  <div className="flex min-h-touch items-center justify-between gap-4 px-4 py-3">
    <div className="min-w-0">
      <label htmlFor={inputId} className="block break-words text-body font-medium text-ink">
        {label}
      </label>
      <p id={`${inputId}-description`} className="break-words text-caption text-ink-muted">
        {description}
      </p>
    </div>
    <div className="flex shrink-0 items-center justify-end">{children}</div>
  </div>
);
