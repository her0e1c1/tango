import type * as React from "react";
import { useId } from "react";
import { AiOutlineDown, AiOutlineEye, AiOutlineGlobal, AiOutlinePlayCircle, AiOutlineTool } from "react-icons/ai";
import { type UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { SettingsFormValues } from "../model/queries/getSettingsFormValues";
import { SettingsRow, SettingsSection } from "./SettingsSection";
import { Select, Slider, Switch } from "@/shared/ui/forms";

const repositoryUrl = "https://github.com/her0e1c1/tango";

export interface SettingsFormProps {
  form: UseFormReturn<SettingsFormValues>;
  studyPreferencesLimits: {
    maxNumberOfCardsToLearn: { min: number; max: number };
    cardInterval: { min: number; max: number };
  };
  version?: string;
  commitHash?: string;
}

export const SettingsForm: React.FC<SettingsFormProps> = (props) => {
  const { t } = useTranslation();
  return (
    <section className="mx-auto flex w-full max-w-reading flex-col gap-4 text-ink">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h1 className="break-words text-title font-bold text-ink">{t("settings.title")}</h1>
        <p className="text-caption text-ink-muted">{t("settings.autoSave")}</p>
      </div>
      <div className="space-y-4">
        <LanguageSettings form={props.form} />
        <AppearanceSettings form={props.form} />
        <StudySettings form={props.form} studyPreferencesLimits={props.studyPreferencesLimits} />
        <AdvancedSettings version={props.version} commitHash={props.commitHash} />
      </div>
    </section>
  );
};

function SettingsSwitch({
  form,
  field,
  label,
  description,
}: {
  form: UseFormReturn<SettingsFormValues>;
  field: import("react-hook-form").FieldPathByValue<SettingsFormValues, boolean>;
  label: string;
  description: string;
}) {
  const id = useId();
  return (
    <SettingsRow inputId={id} label={label} description={description}>
      <Switch {...form.register(field)} id={id} aria-describedby={descriptionId(id)} />
    </SettingsRow>
  );
}

const descriptionId = (inputId: string) => `${inputId}-description`;

function LanguageSettings({ form }: { form: UseFormReturn<SettingsFormValues> }) {
  const { t } = useTranslation();
  const idPrefix = useId();
  const inputIds = {
    language: `${idPrefix}-language`,
  };
  return (
    <SettingsSection
      title={t("settings.language.title")}
      description={t("settings.language.description")}
      icon={<AiOutlineGlobal />}
    >
      <SettingsRow
        inputId={inputIds.language}
        label={t("settings.language.label")}
        description={t("settings.language.help")}
      >
        <Select
          {...form.register("language")}
          id={inputIds.language}
          aria-describedby={descriptionId(inputIds.language)}
          options={[
            { label: t("settings.language.system"), value: "system" },
            { label: t("settings.language.english"), value: "en" },
            { label: t("settings.language.japanese"), value: "ja" },
          ]}
        />
      </SettingsRow>
    </SettingsSection>
  );
}

const appearanceSettings = [
  {
    field: "controls.showSwipeButtonList",
    label: "settings.appearance.showSwipeControls.label",
    description: "settings.appearance.showSwipeControls.help",
  },
  {
    field: "controls.showBackTextSwipeOverlays",
    label: "settings.appearance.showBackTextSwipeOverlays.label",
    description: "settings.appearance.showBackTextSwipeOverlays.help",
  },
  {
    field: "controls.showPlaybackControls",
    label: "settings.appearance.showPlaybackControls.label",
    description: "settings.appearance.showPlaybackControls.help",
  },
  {
    field: "controls.showCardDetails",
    label: "settings.appearance.showCardDetails.label",
    description: "settings.appearance.showCardDetails.help",
  },
  {
    field: "appearance.showSwipeFeedback",
    label: "settings.appearance.showSwipeFeedback.label",
    description: "settings.appearance.showSwipeFeedback.help",
  },
  {
    field: "controls.showSkip",
    label: "settings.appearance.showSkip.label",
    description: "settings.appearance.showSkip.help",
  },
  {
    field: "appearance.darkMode",
    label: "settings.appearance.darkMode.label",
    description: "settings.appearance.darkMode.help",
  },
] as const;

function AppearanceSettings({ form }: { form: UseFormReturn<SettingsFormValues> }) {
  const { t } = useTranslation();
  return (
    <SettingsSection
      title={t("settings.appearance.title")}
      description={t("settings.appearance.description")}
      icon={<AiOutlineEye />}
    >
      {appearanceSettings.map(({ field, label, description }) => (
        <SettingsSwitch key={field} form={form} field={field} label={t(label)} description={t(description)} />
      ))}
    </SettingsSection>
  );
}

interface StudySettingsProps {
  form: UseFormReturn<SettingsFormValues>;
  studyPreferencesLimits: SettingsFormProps["studyPreferencesLimits"];
}

function StudySettings(props: StudySettingsProps) {
  const { t } = useTranslation();
  return (
    <SettingsSection
      title={t("settings.study.title")}
      description={t("settings.study.description")}
      icon={<AiOutlinePlayCircle />}
    >
      <SettingsSwitch
        form={props.form}
        field="study.shuffled"
        label={t("settings.study.shuffleCards.label")}
        description={t("settings.study.shuffleCards.help")}
      />
      <MaximumCardsSetting {...props} />
      <SettingsSwitch
        form={props.form}
        field="study.useCardInterval"
        label={t("settings.study.respectReviewSchedule.label")}
        description={t("settings.study.respectReviewSchedule.help")}
      />
      <SettingsSwitch
        form={props.form}
        field="study.defaultAutoPlay"
        label={t("settings.study.startAutoplay.label")}
        description={t("settings.study.startAutoplay.help")}
      />
      <AutoplayIntervalSetting {...props} />
    </SettingsSection>
  );
}

function MaximumCardsSetting(props: StudySettingsProps) {
  const { t } = useTranslation();
  const idPrefix = useId();
  const inputIds = {
    maxNumberOfCardsToLearn: `${idPrefix}-maximum-cards`,
  };
  const maxNumberOfCardsToLearn = useWatch({ control: props.form.control, name: "study.maxNumberOfCardsToLearn" });
  const maximumCardsLabel =
    maxNumberOfCardsToLearn === 0 ? t("settings.study.maximumCards.allMatching") : maxNumberOfCardsToLearn;
  return (
    <SettingsRow
      inputId={inputIds.maxNumberOfCardsToLearn}
      label={t("settings.study.maximumCards.label")}
      description={t("settings.study.maximumCards.help")}
      controlPosition="second-row"
    >
      <div className="flex w-full items-center gap-2">
        <Slider
          {...props.form.register("study.maxNumberOfCardsToLearn", { valueAsNumber: true })}
          min={props.studyPreferencesLimits.maxNumberOfCardsToLearn.min}
          max={props.studyPreferencesLimits.maxNumberOfCardsToLearn.max}
          id={inputIds.maxNumberOfCardsToLearn}
          aria-describedby={descriptionId(inputIds.maxNumberOfCardsToLearn)}
          aria-valuetext={
            maxNumberOfCardsToLearn === 0
              ? t("settings.study.maximumCards.allMatching")
              : t("settings.study.maximumCards.value", { count: maxNumberOfCardsToLearn })
          }
        />
        <span className="min-w-10 rounded-control bg-surface-muted px-2 py-1 text-center text-caption font-bold text-accent-primary">
          {maximumCardsLabel}
        </span>
      </div>
    </SettingsRow>
  );
}

function AutoplayIntervalSetting(props: StudySettingsProps) {
  const { t } = useTranslation();
  const idPrefix = useId();
  const inputIds = {
    cardInterval: `${idPrefix}-autoplay-interval`,
  };
  const cardInterval = useWatch({ control: props.form.control, name: "study.cardInterval" });
  return (
    <SettingsRow
      inputId={inputIds.cardInterval}
      label={t("settings.study.autoplayInterval.label")}
      description={t("settings.study.autoplayInterval.help")}
      controlPosition="second-row"
    >
      <div className="flex w-full items-center gap-2">
        <Slider
          {...props.form.register("study.cardInterval", { valueAsNumber: true })}
          min={props.studyPreferencesLimits.cardInterval.min}
          max={props.studyPreferencesLimits.cardInterval.max}
          id={inputIds.cardInterval}
          aria-describedby={descriptionId(inputIds.cardInterval)}
          aria-valuetext={t("settings.study.autoplayInterval.value", { count: cardInterval })}
        />
        <span className="min-w-10 rounded-control bg-surface-muted px-2 py-1 text-center text-caption font-bold text-accent-primary">
          {t("settings.study.autoplayInterval.shortValue", { count: cardInterval })}
        </span>
      </div>
    </SettingsRow>
  );
}

function AdvancedSettings(props: { version: string | undefined; commitHash: string | undefined }) {
  const { t } = useTranslation();
  const idPrefix = useId();
  const advancedHeadingId = `${idPrefix}-advanced-heading`;
  const shortCommitHash = props.commitHash?.slice(0, 7);
  const commitUrl =
    props.commitHash && props.commitHash !== "unknown" ? `${repositoryUrl}/commit/${props.commitHash}` : undefined;
  return (
    <details
      aria-labelledby={advancedHeadingId}
      className="group overflow-hidden rounded-surface border border-border bg-surface shadow-surface"
    >
      <summary
        className="flex min-h-touch cursor-pointer list-none items-center gap-3 rounded-[inherit] px-4 py-3 [&::-webkit-details-marker]:hidden"
        style={{ outlineOffset: "calc(-1 * var(--calm-focus-ring-offset))" }}
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-control bg-surface-muted text-accent-primary"
        >
          <AiOutlineTool />
        </span>
        <span className="min-w-0 flex-1">
          <h2 id={advancedHeadingId} className="text-body font-bold text-ink">
            {t("settings.advanced.title")}
          </h2>
          <span className="block text-caption text-ink-muted">{t("settings.advanced.description")}</span>
        </span>
        <AiOutlineDown
          aria-hidden="true"
          className="shrink-0 text-ink-muted transition-transform duration-normal ease-calm group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-border">
        <div className="flex min-h-touch items-center justify-between gap-4 px-4 py-3">
          <span className="text-body font-medium text-ink">{t("settings.advanced.version")}</span>
          <span className="min-w-0 break-all text-right text-caption text-ink-muted">{props.version}</span>
        </div>
        <div className="flex min-h-touch items-center justify-between gap-4 border-t border-border px-4 py-3">
          <span className="text-body font-medium text-ink">{t("settings.advanced.commitHash")}</span>
          {commitUrl ? (
            <a
              className="min-w-0 break-all text-right text-caption text-accent-primary underline underline-offset-2"
              href={commitUrl}
              rel="noreferrer"
              target="_blank"
            >
              {shortCommitHash}
            </a>
          ) : (
            <span className="min-w-0 break-all text-right text-caption text-ink-muted">{shortCommitHash}</span>
          )}
        </div>
      </div>
    </details>
  );
}
