import type * as React from "react";
import { useId } from "react";
import { AiOutlineEye, AiOutlinePlayCircle } from "react-icons/ai";

import { SettingsRow, SettingsSection } from "./SettingsSection";
import { Slider, Switch } from "@/shared/ui/forms";

interface SettingsFields {
  showHeader: React.ComponentProps<typeof Switch>;
  showSwipeButtonList: React.ComponentProps<typeof Switch>;
  showSwipeFeedback: React.ComponentProps<typeof Switch>;
  darkMode: React.ComponentProps<typeof Switch>;
  shuffled: React.ComponentProps<typeof Switch>;
  useCardInterval: React.ComponentProps<typeof Switch>;
  maxNumberOfCardsToLearn: React.ComponentProps<typeof Slider>;
  defaultAutoPlay: React.ComponentProps<typeof Switch>;
  cardInterval: React.ComponentProps<typeof Slider>;
}

export interface SettingsFormProps {
  fields: SettingsFields;
  maxNumberOfCardsToLearn: number;
  cardInterval: number;
}

export const SettingsForm: React.FC<SettingsFormProps> = (props) => {
  const idPrefix = useId();
  const inputIds = {
    showHeader: `${idPrefix}-show-header`,
    showSwipeButtonList: `${idPrefix}-show-study-buttons`,
    showSwipeFeedback: `${idPrefix}-show-swipe-feedback`,
    darkMode: `${idPrefix}-dark-mode`,
    shuffled: `${idPrefix}-shuffle-cards`,
    maxNumberOfCardsToLearn: `${idPrefix}-maximum-cards`,
    useCardInterval: `${idPrefix}-use-card-interval`,
    defaultAutoPlay: `${idPrefix}-start-autoplay`,
    cardInterval: `${idPrefix}-autoplay-interval`,
  };
  /**
   * Builds the stable HTML identifier used by a field's explanatory text.
   * Inputs can reference this identifier with `aria-describedby` so assistive technology reads the
   * description.
   */
  const descriptionId = (inputId: string) => `${inputId}-description`;

  return (
    <div className="space-y-4">
      <SettingsSection title="Appearance" description="Navigation and visual feedback" icon={<AiOutlineEye />}>
        <SettingsRow inputId={inputIds.showHeader} label="Show header" description="Keep app navigation visible">
          <Switch
            {...props.fields.showHeader}
            id={inputIds.showHeader}
            aria-describedby={descriptionId(inputIds.showHeader)}
          />
        </SettingsRow>
        <SettingsRow
          inputId={inputIds.showSwipeButtonList}
          label="Show study buttons"
          description="Display study action controls"
        >
          <Switch
            {...props.fields.showSwipeButtonList}
            id={inputIds.showSwipeButtonList}
            aria-describedby={descriptionId(inputIds.showSwipeButtonList)}
          />
        </SettingsRow>
        <SettingsRow
          inputId={inputIds.showSwipeFeedback}
          label="Show swipe feedback"
          description="Confirm each study action on screen"
        >
          <Switch
            {...props.fields.showSwipeFeedback}
            id={inputIds.showSwipeFeedback}
            aria-describedby={descriptionId(inputIds.showSwipeFeedback)}
          />
        </SettingsRow>
        <SettingsRow inputId={inputIds.darkMode} label="Dark mode" description="Use the darker Calm Focus palette">
          <Switch
            {...props.fields.darkMode}
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
            {...props.fields.shuffled}
            id={inputIds.shuffled}
            aria-describedby={descriptionId(inputIds.shuffled)}
          />
        </SettingsRow>
        <SettingsRow
          inputId={inputIds.maxNumberOfCardsToLearn}
          label="Maximum cards"
          description="Limit the size of a study session"
        >
          <div className="flex w-32 items-center gap-2 sm:w-52">
            <Slider
              {...props.fields.maxNumberOfCardsToLearn}
              id={inputIds.maxNumberOfCardsToLearn}
              aria-describedby={descriptionId(inputIds.maxNumberOfCardsToLearn)}
              aria-valuetext={`${props.maxNumberOfCardsToLearn} cards`}
            />
            <span className="min-w-10 rounded-control bg-surface-muted px-2 py-1 text-center text-caption font-bold text-accent-primary">
              {props.maxNumberOfCardsToLearn}
            </span>
          </div>
        </SettingsRow>
        <SettingsRow
          inputId={inputIds.useCardInterval}
          label="Respect review schedule"
          description="Hide cards until their next review time"
        >
          <Switch
            {...props.fields.useCardInterval}
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
            {...props.fields.defaultAutoPlay}
            id={inputIds.defaultAutoPlay}
            aria-describedby={descriptionId(inputIds.defaultAutoPlay)}
          />
        </SettingsRow>
        <SettingsRow inputId={inputIds.cardInterval} label="Autoplay interval" description="Seconds between cards">
          <div className="flex w-32 items-center gap-2 sm:w-52">
            <Slider
              {...props.fields.cardInterval}
              id={inputIds.cardInterval}
              aria-describedby={descriptionId(inputIds.cardInterval)}
              aria-valuetext={`${props.cardInterval} seconds`}
            />
            <span className="min-w-10 rounded-control bg-surface-muted px-2 py-1 text-center text-caption font-bold text-accent-primary">
              {props.cardInterval}s
            </span>
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
};
