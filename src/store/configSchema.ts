/**
 * @file Defines application configuration behavior for Config Schema.
 * It validates persisted settings and exposes a predictable store interface to the rest of the
 * application.
 */

import * as z from "zod";

export const defaultConfig: ConfigState = {
  useCardInterval: false,
  showSwipeButtonList: true,
  showScoreSlider: false,
  showHeader: true,
  fullscreen: false,
  maxNumberOfCardsToLearn: 10,
  hideBodyWhenCardChanged: true,
  sizeBackText: 0,
  shuffled: false,
  defaultAutoPlay: false,
  cardInterval: 60,
  keepBackTextViewed: false,
  showSwipeFeedback: false,
  cardSwipeUp: "GoToNextCardMastered",
  cardSwipeDown: "GoToNextCardNotMastered",
  cardSwipeLeft: "GoToPrevCard",
  cardSwipeRight: "GoToNextCard",
  darkMode: false,
  selectedTags: [],
  githubAccessToken: "",
};

const cardSwipeSchema = z.enum([
  "DoNothing",
  "GoBack",
  "GoToPrevCard",
  "GoToNextCard",
  "GoToNextCardMastered",
  "GoToNextCardNotMastered",
  "GoToNextCardToggleMastered",
]);

const configSchema: z.ZodType<ConfigState> = z
  .object({
    useCardInterval: z.boolean().catch(defaultConfig.useCardInterval),
    showSwipeButtonList: z.boolean().catch(defaultConfig.showSwipeButtonList),
    showScoreSlider: z.boolean().catch(defaultConfig.showScoreSlider),
    showHeader: z.boolean().catch(defaultConfig.showHeader),
    fullscreen: z.boolean().catch(defaultConfig.fullscreen),
    maxNumberOfCardsToLearn: z.number().catch(defaultConfig.maxNumberOfCardsToLearn),
    hideBodyWhenCardChanged: z.boolean().catch(defaultConfig.hideBodyWhenCardChanged),
    sizeBackText: z.number().catch(defaultConfig.sizeBackText),
    shuffled: z.boolean().catch(defaultConfig.shuffled),
    defaultAutoPlay: z.boolean().catch(defaultConfig.defaultAutoPlay),
    cardInterval: z.number().catch(defaultConfig.cardInterval),
    keepBackTextViewed: z.boolean().catch(defaultConfig.keepBackTextViewed),
    showSwipeFeedback: z.boolean().catch(defaultConfig.showSwipeFeedback),
    cardSwipeUp: cardSwipeSchema.catch(defaultConfig.cardSwipeUp),
    cardSwipeDown: cardSwipeSchema.catch(defaultConfig.cardSwipeDown),
    cardSwipeLeft: cardSwipeSchema.catch(defaultConfig.cardSwipeLeft),
    cardSwipeRight: cardSwipeSchema.catch(defaultConfig.cardSwipeRight),
    darkMode: z.boolean().catch(defaultConfig.darkMode),
    selectedTags: z.array(z.string()).catch(defaultConfig.selectedTags),
    githubAccessToken: z.string().catch(defaultConfig.githubAccessToken),
  })
  .catch(defaultConfig);

const persistedConfigStateSchema = z.object({ config: configSchema }).catch({ config: defaultConfig });

/**
 * Parses persisted config into validated application data.
 * Malformed input is reported before downstream code relies on the result.
 */
export const parsePersistedConfig = (persistedState: unknown): ConfigState =>
  persistedConfigStateSchema.parse(persistedState).config;
