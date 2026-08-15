import React from "react";

import { SettingsRow } from "./SettingsSection";

export const SettingsRowFixture = ({ described = false }: { described?: boolean }) => {
  const inputId = React.useId();
  return (
    <SettingsRow inputId={inputId} label="Dark mode" description="Use the darker Calm Focus palette">
      <input id={inputId} aria-describedby={described ? `${inputId}-description` : undefined} />
    </SettingsRow>
  );
};
