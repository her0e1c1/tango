import type { Preferences } from "@/entities/preferences";
import { SettingsForm } from "../../ui/components/SettingsForm";
import { usePreferencesFormState } from "./usePreferencesFormState";

export const SettingsFormHarness = ({
  preferences,
  onSubmit,
}: {
  preferences: Preferences;
  onSubmit: (preferences: Preferences) => void;
}) => {
  const formState = usePreferencesFormState({ preferences, onSubmit });
  return <SettingsForm {...formState} />;
};
