import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/app/main.tsx!"],
  project: [
    "src/**/*.{ts,tsx}!",
    "!src/**/*.{spec,test}.{ts,tsx}!",
    "!src/**/*.stories.{ts,tsx}!",
  ],
  // These modules are reached only from spec or Storybook entries, which this production-only graph excludes.
  ignore: [
    "src/features/card-list/ui/CardListViewStoryExamples.tsx",
    "src/features/card-list/ui/ControlledCard.tsx",
    "src/features/card-list/ui/ControlledCardActionsMenu.tsx",
    "src/features/deck-filter/model/DeckFilterHarness.tsx",
    "src/features/deck-filter/ui/InteractiveTagFilter.tsx",
    "src/features/deck-list/ui/ControlledDeckList.tsx",
    "src/features/deck-list/ui/ControlledDeckListCard.tsx",
    "src/features/deck-list/ui/DeckActionsMenuTestComponents.tsx",
    "src/features/preferences-edit/model/hooks/SettingsFormHarness.tsx",
    "src/features/preferences-edit/ui/components/SettingsRowFixture.tsx",
    "src/features/study/components/WorkflowView.tsx",
    "src/features/study/hooks/ControllerHarness.tsx",
    "src/shared/router/RouteParamTestRouter.tsx",
    "src/shared/ui/actions-menu/ActionsMenuTestComponents.tsx",
    "src/shared/ui/button-interaction/ButtonInteractionTestComponents.tsx",
    "src/shared/ui/forms/ExternallyLabelledInput.tsx",
    "src/shared/ui/forms/InteractiveSlider.tsx",
    "src/shared/ui/forms/SelectionControlTestComponents.tsx",
  ],
  ignoreDependencies: ["@feature-sliced/steiger-plugin", "tailwindcss"],
  includeEntryExports: true,
};

export default config;
