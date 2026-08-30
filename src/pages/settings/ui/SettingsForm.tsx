import type * as React from "react";
import { useId } from "react";
import { AiOutlineDown, AiOutlineEye, AiOutlineGlobal, AiOutlinePlayCircle, AiOutlineTool } from "react-icons/ai";
import { type UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { Preferences } from "@/entities/preference";
import { SettingsRow, SettingsSection } from "./SettingsSection";
import { Select, Slider, Switch } from "@/shared/ui/forms";

const repositoryUrl = "https://github.com/her0e1c1/tango";

export interface SettingsFormProps {
  form: UseFormReturn<Preferences>;
  studyPreferencesLimits: {
    maxNumberOfCardsToLearn: { min: number; max: number };
    cardInterval: { min: number; max: number };
  };
  version?: string;
  commitHash?: string;
}

export const SettingsForm: React.FC<SettingsFormProps> = (props) => {
  const { t } = useTranslation();
  const shortCommitHash = props.commitHash?.slice(0, 7);
  const commitUrl =
    props.commitHash && props.commitHash !== "unknown" ? `${repositoryUrl}/commit/${props.commitHash}` : undefined;
  const maxNumberOfCardsToLearn = useWatch({
    control: props.form.control,
    name: "study.maxNumberOfCardsToLearn",
  });
  const cardInterval = useWatch({ control: props.form.control, name: "study.cardInterval" });
  const idPrefix = useId();
  const inputIds = {
    language: `${idPrefix}-language`,
    showSwipeButtonList: `${idPrefix}-show-swipe-controls`,
    showBackTextSwipeOverlays: `${idPrefix}-show-back-text-swipe-overlays`,
    showPlaybackControls: `${idPrefix}-show-playback-controls`,
    showCardDetails: `${idPrefix}-show-card-details`,
    showSwipeFeedback: `${idPrefix}-show-swipe-feedback`,
    darkMode: `${idPrefix}-dark-mode`,
    shuffled: `${idPrefix}-shuffle-cards`,
    maxNumberOfCardsToLearn: `${idPrefix}-maximum-cards`,
    useCardInterval: `${idPrefix}-use-card-interval`,
    defaultAutoPlay: `${idPrefix}-start-autoplay`,
    cardInterval: `${idPrefix}-autoplay-interval`,
  };
  const advancedHeadingId = `${idPrefix}-advanced-heading`;
  /**
   * Builds the stable HTML identifier used by a field's explanatory text.
   * Inputs can reference this identifier with `aria-describedby` so assistive technology reads the
   * description.
   */
  const descriptionId = (inputId: string) => `${inputId}-description`;

  return (
    <section className="mx-auto flex w-full max-w-reading flex-col gap-4 text-ink">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h1 className="break-words text-title font-bold text-ink">{t("settings.title")}</h1>
        <p className="text-caption text-ink-muted">{t("settings.autoSave")}</p>
      </div>
      <div className="space-y-4">
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
              {...props.form.register("language")}
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

        <SettingsSection
          title={t("settings.appearance.title")}
          description={t("settings.appearance.description")}
          icon={<AiOutlineEye />}
        >
          <SettingsRow
            inputId={inputIds.showSwipeButtonList}
            label={t("settings.appearance.showSwipeControls.label")}
            description={t("settings.appearance.showSwipeControls.help")}
          >
            <Switch
              {...props.form.register("controls.showSwipeButtonList")}
              id={inputIds.showSwipeButtonList}
              aria-describedby={descriptionId(inputIds.showSwipeButtonList)}
            />
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.showBackTextSwipeOverlays}
            label="Show back text swipe overlays"
            description="Display left and right study actions while viewing an answer"
          >
            <Switch
              {...props.form.register("controls.showBackTextSwipeOverlays")}
              id={inputIds.showBackTextSwipeOverlays}
              aria-describedby={descriptionId(inputIds.showBackTextSwipeOverlays)}
            />
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.showPlaybackControls}
            label={t("settings.appearance.showPlaybackControls.label")}
            description={t("settings.appearance.showPlaybackControls.help")}
          >
            <Switch
              {...props.form.register("controls.showPlaybackControls")}
              id={inputIds.showPlaybackControls}
              aria-describedby={descriptionId(inputIds.showPlaybackControls)}
            />
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.showCardDetails}
            label={t("settings.appearance.showCardDetails.label")}
            description={t("settings.appearance.showCardDetails.help")}
          >
            <Switch
              {...props.form.register("controls.showCardDetails")}
              id={inputIds.showCardDetails}
              aria-describedby={descriptionId(inputIds.showCardDetails)}
            />
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.showSwipeFeedback}
            label={t("settings.appearance.showSwipeFeedback.label")}
            description={t("settings.appearance.showSwipeFeedback.help")}
          >
            <Switch
              {...props.form.register("appearance.showSwipeFeedback")}
              id={inputIds.showSwipeFeedback}
              aria-describedby={descriptionId(inputIds.showSwipeFeedback)}
            />
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.darkMode}
            label={t("settings.appearance.darkMode.label")}
            description={t("settings.appearance.darkMode.help")}
          >
            <Switch
              {...props.form.register("appearance.darkMode")}
              id={inputIds.darkMode}
              aria-describedby={descriptionId(inputIds.darkMode)}
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection
          title={t("settings.study.title")}
          description={t("settings.study.description")}
          icon={<AiOutlinePlayCircle />}
        >
          <SettingsRow
            inputId={inputIds.shuffled}
            label={t("settings.study.shuffleCards.label")}
            description={t("settings.study.shuffleCards.help")}
          >
            <Switch
              {...props.form.register("study.shuffled")}
              id={inputIds.shuffled}
              aria-describedby={descriptionId(inputIds.shuffled)}
            />
          </SettingsRow>
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
                aria-valuetext={t("settings.study.maximumCards.value", { count: maxNumberOfCardsToLearn })}
              />
              <span className="min-w-10 rounded-control bg-surface-muted px-2 py-1 text-center text-caption font-bold text-accent-primary">
                {maxNumberOfCardsToLearn}
              </span>
            </div>
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.useCardInterval}
            label={t("settings.study.respectReviewSchedule.label")}
            description={t("settings.study.respectReviewSchedule.help")}
          >
            <Switch
              {...props.form.register("study.useCardInterval")}
              id={inputIds.useCardInterval}
              aria-describedby={descriptionId(inputIds.useCardInterval)}
            />
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.defaultAutoPlay}
            label={t("settings.study.startAutoplay.label")}
            description={t("settings.study.startAutoplay.help")}
          >
            <Switch
              {...props.form.register("study.defaultAutoPlay")}
              id={inputIds.defaultAutoPlay}
              aria-describedby={descriptionId(inputIds.defaultAutoPlay)}
            />
          </SettingsRow>
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
        </SettingsSection>

        <details
          aria-labelledby={advancedHeadingId}
          className="group overflow-hidden rounded-surface border border-border bg-surface shadow-surface"
        >
          <summary className="flex min-h-touch cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
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
      </div>
    </section>
  );
};
