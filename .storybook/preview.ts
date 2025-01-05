import type { Preview } from "@storybook/react";
import 'tailwindcss/tailwind.css'

const preview: Preview = {
  parameters: {
    darkMode: {
      darkClass: 'dark',
      stylePreview: true,
      classTarget: 'html'
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;

