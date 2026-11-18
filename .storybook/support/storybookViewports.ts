import { INITIAL_VIEWPORTS as storybookViewports } from "storybook/viewport";

export const INITIAL_VIEWPORTS = {
  ...storybookViewports,
  // Use explicit landscape dimensions.
  landscape812: {
    name: "Landscape (812 × 375)",
    styles: { width: "812px", height: "375px" },
    type: "mobile",
  },
  desktop1280: {
    name: "Desktop (1280 × 800)",
    styles: { width: "1280px", height: "800px" },
    type: "desktop",
  },
};
