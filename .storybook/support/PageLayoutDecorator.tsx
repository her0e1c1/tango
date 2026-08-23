import { Layout } from "@/shared/ui/layout";

import type { Decorator } from "@storybook/react";

// Page presentation stories opt in so route integration stories keep their own application shell.
export const withPageLayout: Decorator = (Story) => (
  <Layout>
    <Story />
  </Layout>
);
