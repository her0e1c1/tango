import type * as React from "react";
import { useId } from "react";
import { AiOutlineDown, AiOutlineEye, AiOutlinePlayCircle, AiOutlineTool, AiOutlineUser } from "react-icons/ai";

import { SettingsRow, SettingsSection } from "@/features/settings/components/SettingsSection";
import { Button, Input, Slider, Switch } from "@/components";

export interface ConfigFormFields {
  showHeader: React.ComponentProps<typeof Switch>;
  showSwipeButtonList: React.ComponentProps<typeof Switch>;
  showSwipeFeedback: React.ComponentProps<typeof Switch>;
  darkMode: React.ComponentProps<typeof Switch>;
  shuffled: React.ComponentProps<typeof Switch>;
  useCardInterval: React.ComponentProps<typeof Switch>;
  maxNumberOfCardsToLearn: React.ComponentProps<typeof Slider>;
  defaultAutoPlay: React.ComponentProps<typeof Switch>;
  cardInterval: React.ComponentProps<typeof Slider>;
  githubAccessToken: React.ComponentProps<typeof Input>;
}

export interface ConfigFormProps {
  isLoggedIn?: boolean;
  identity?: { uid: string; displayName: string | null };
  config: ConfigState;
  fields: ConfigFormFields;
  maxNumberOfCardsToLearn: number;
  cardInterval: number;
  onLogin?: () => void;
  onLogout?: () => void;
  accountPending?: boolean;
  accountFeedback?: React.ReactNode;
  version?: string;
}

export const ConfigForm: React.FC<ConfigFormProps> = (props) => {
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
    githubAccessToken: `${idPrefix}-github-access-token`,
  };
  const advancedHeadingId = `${idPrefix}-advanced-heading`;
  const descriptionId = (inputId: string) => `${inputId}-description`;

  return (
    <div className="space-y-4 text-ink">
      <SettingsSection title="Account" description="Profile and sign-in" icon={<AiOutlineUser />}>
        <div className="flex min-h-touch items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-primary text-ink-inverse"
            >
              <AiOutlineUser />
            </span>
            <div className="min-w-0">
              <p className="break-words text-body font-medium text-ink">
                {props.isLoggedIn ? (props.identity?.displayName ?? "No name") : "Google Login"}
              </p>
              <p className="text-caption text-ink-muted">
                {props.isLoggedIn ? "Signed in with Google" : "Sync your decks across devices"}
              </p>
            </div>
          </div>
          {props.isLoggedIn ? (
            <Button
              variant="quiet"
              size="sm"
              {...(props.accountPending !== undefined ? { loading: props.accountPending } : {})}
              {...(props.onLogout !== undefined ? { onClick: props.onLogout } : {})}
            >
              Logout
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              {...(props.accountPending !== undefined ? { loading: props.accountPending } : {})}
              {...(props.onLogin !== undefined ? { onClick: props.onLogin } : {})}
            >
              Login
            </Button>
          )}
        </div>
        {props.accountFeedback}
      </SettingsSection>

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
          label="Use card interval"
          description="Wait between automatic card changes"
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
            <span className="block text-caption text-ink-muted">Version, token, and user ID</span>
          </span>
          <AiOutlineDown
            aria-hidden="true"
            className="shrink-0 text-ink-muted transition-transform duration-normal ease-calm group-open:rotate-180"
          />
        </summary>
        <div className="divide-y divide-border border-t border-border">
          <div className="flex min-h-touch items-center justify-between gap-4 px-4 py-3">
            <span className="text-body font-medium text-ink">Version</span>
            <span className="min-w-0 break-all text-right text-caption text-ink-muted">{props.version}</span>
          </div>
          <div className="px-4 py-3">
            <label htmlFor={inputIds.githubAccessToken} className="text-body font-medium text-ink">
              Github Access Token
            </label>
            <span className="block text-caption text-ink-muted">Used when importing private GitHub content</span>
            <Input className="mt-2" {...props.fields.githubAccessToken} id={inputIds.githubAccessToken} />
          </div>
          <div className="flex min-h-touch items-start justify-between gap-4 px-4 py-3">
            <span className="shrink-0 text-body font-medium text-ink">User ID</span>
            <span className="min-w-0 break-all text-right text-caption text-ink-muted">
              {props.identity?.uid ?? ""}
            </span>
          </div>
        </div>
      </details>
    </div>
  );
};
