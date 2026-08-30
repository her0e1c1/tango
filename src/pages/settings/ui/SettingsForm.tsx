import type * as React from "react";
import { useId } from "react";
import { AiOutlineDown, AiOutlineEye, AiOutlinePlayCircle, AiOutlineTool } from "react-icons/ai";
import { type UseFormReturn, useWatch } from "react-hook-form";

import type { Preferences } from "@/entities/preference";
import { SettingsRow, SettingsSection } from "./SettingsSection";
import { Slider, Switch } from "@/shared/ui/forms";

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
  const maxNumberOfCardsToLearn = useWatch({
    control: props.form.control,
    name: "study.maxNumberOfCardsToLearn",
  });
  const cardInterval = useWatch({ control: props.form.control, name: "study.cardInterval" });
  const idPrefix = useId();
  const inputIds = {
    showSwipeButtonList: `${idPrefix}-show-swipe-controls`,
    showBackTextSwipeOverlays: `${idPrefix}-show-back-text-swipe-overlays`,
    showPlaybackControls: `${idPrefix}-show-playback-controls`,
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
        <h1 className="break-words text-title font-bold text-ink">Settings</h1>
        <p className="text-caption text-ink-muted">Changes are saved automatically</p>
      </div>
      <div className="space-y-4">
        <SettingsSection title="Appearance" description="Study controls and visual feedback" icon={<AiOutlineEye />}>
          <SettingsRow
            inputId={inputIds.showSwipeButtonList}
            label="Show swipe controls"
            description="Display study swipe action controls"
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
            label="Show playback controls"
            description="Display autoplay and progress controls"
          >
            <Switch
              {...props.form.register("controls.showPlaybackControls")}
              id={inputIds.showPlaybackControls}
              aria-describedby={descriptionId(inputIds.showPlaybackControls)}
            />
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.showSwipeFeedback}
            label="Show swipe feedback"
            description="Confirm each study action on screen"
          >
            <Switch
              {...props.form.register("appearance.showSwipeFeedback")}
              id={inputIds.showSwipeFeedback}
              aria-describedby={descriptionId(inputIds.showSwipeFeedback)}
            />
          </SettingsRow>
          <SettingsRow inputId={inputIds.darkMode} label="Dark mode" description="Use the darker Calm Focus palette">
            <Switch
              {...props.form.register("appearance.darkMode")}
              id={inputIds.darkMode}
              aria-describedby={descriptionId(inputIds.darkMode)}
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection
          title="Study"
          description="Card order, session size, and autoplay"
          icon={<AiOutlinePlayCircle />}
        >
          <SettingsRow inputId={inputIds.shuffled} label="Shuffle cards" description="Randomize each study session">
            <Switch
              {...props.form.register("study.shuffled")}
              id={inputIds.shuffled}
              aria-describedby={descriptionId(inputIds.shuffled)}
            />
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.maxNumberOfCardsToLearn}
            label="Maximum cards"
            description="Limit the size of a study session"
            controlPosition="second-row"
          >
            <div className="flex w-full items-center gap-2">
              <Slider
                {...props.form.register("study.maxNumberOfCardsToLearn", { valueAsNumber: true })}
                min={props.studyPreferencesLimits.maxNumberOfCardsToLearn.min}
                max={props.studyPreferencesLimits.maxNumberOfCardsToLearn.max}
                id={inputIds.maxNumberOfCardsToLearn}
                aria-describedby={descriptionId(inputIds.maxNumberOfCardsToLearn)}
                aria-valuetext={`${String(maxNumberOfCardsToLearn)} cards`}
              />
              <span className="min-w-10 rounded-control bg-surface-muted px-2 py-1 text-center text-caption font-bold text-accent-primary">
                {maxNumberOfCardsToLearn}
              </span>
            </div>
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.useCardInterval}
            label="Respect review schedule"
            description="Hide cards until their next review time"
          >
            <Switch
              {...props.form.register("study.useCardInterval")}
              id={inputIds.useCardInterval}
              aria-describedby={descriptionId(inputIds.useCardInterval)}
            />
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.defaultAutoPlay}
            label="Start autoplay"
            description="Begin playback when study opens"
          >
            <Switch
              {...props.form.register("study.defaultAutoPlay")}
              id={inputIds.defaultAutoPlay}
              aria-describedby={descriptionId(inputIds.defaultAutoPlay)}
            />
          </SettingsRow>
          <SettingsRow
            inputId={inputIds.cardInterval}
            label="Autoplay interval"
            description="Seconds between cards"
            controlPosition="second-row"
          >
            <div className="flex w-full items-center gap-2">
              <Slider
                {...props.form.register("study.cardInterval", { valueAsNumber: true })}
                min={props.studyPreferencesLimits.cardInterval.min}
                max={props.studyPreferencesLimits.cardInterval.max}
                id={inputIds.cardInterval}
                aria-describedby={descriptionId(inputIds.cardInterval)}
                aria-valuetext={`${String(cardInterval)} seconds`}
              />
              <span className="min-w-10 rounded-control bg-surface-muted px-2 py-1 text-center text-caption font-bold text-accent-primary">
                {cardInterval}s
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
                Advanced
              </h2>
              <span className="block text-caption text-ink-muted">Application version and commit</span>
            </span>
            <AiOutlineDown
              aria-hidden="true"
              className="shrink-0 text-ink-muted transition-transform duration-normal ease-calm group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-border">
            <div className="flex min-h-touch items-center justify-between gap-4 px-4 py-3">
              <span className="text-body font-medium text-ink">Version</span>
              <span className="min-w-0 break-all text-right text-caption text-ink-muted">{props.version}</span>
            </div>
            <div className="flex min-h-touch items-center justify-between gap-4 border-t border-border px-4 py-3">
              <span className="text-body font-medium text-ink">Commit hash</span>
              <span className="min-w-0 break-all text-right text-caption text-ink-muted">{props.commitHash}</span>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
};
