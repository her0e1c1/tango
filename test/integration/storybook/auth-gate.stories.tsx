import type { StoryObj } from "@storybook/react-vite";
import { lazy, Suspense } from "react";
import { beforeAuthStateChanged, onIdTokenChanged } from "@firebase/auth";
import { disableNetwork } from "@firebase/firestore";
import { expect, mocked } from "storybook/test";
import { replaceAuthSession } from "@/entities/auth";
import { APP_STORY_UID } from "@/storybook/appStory";
import { routeMeta, state, deck, prepareWith } from "./support";

const AuthBoundary = lazy(async () => {
  const module = await import("@/app/auth");
  return { default: module.AuthProvider };
});
// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  ...routeMeta,
  title: "Integration/Card list initialization",
  parameters: { ...routeMeta.parameters, page: { ...state, path: `/deck/${deck.id}` } },
  render: (args: Parameters<typeof routeMeta.render>[0], context: Parameters<typeof routeMeta.render>[1]) => (
    <Suspense fallback={<p>Starting Tango…</p>}>
      <AuthBoundary>{routeMeta.render(args, context)}</AuthBoundary>
    </Suspense>
  ),
  beforeEach: prepareWith(() => {
    mocked(disableNetwork).mockResolvedValue(undefined);
    mocked(beforeAuthStateChanged).mockReturnValue(() => undefined);
    mocked(onIdTokenChanged).mockReturnValue(() => undefined);
    replaceAuthSession({ status: "initializing" });
    return () => {
      mocked(disableNetwork).mockReset();
      mocked(beforeAuthStateChanged).mockReset();
      mocked(onIdTokenChanged).mockReset();
    };
  }),
};
export default meta;
type Story = StoryObj<typeof meta>;

export const WaitingForData: Story = {
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step(
      "STORYBOOK-CARD-LIST-10 Keep unconfirmed data behind the real application initialization gate",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        // When: Storybook renders this scenario with its configured args and parameters.
        // Then: Verify the expected result in the assertions below.
        await expect(await canvas.findByRole("heading", { name: "Starting Tango…" })).toBeVisible();
        await expect(canvas.queryByRole("heading", { name: "No cards yet" })).not.toBeInTheDocument();
        await expect(
          canvas.queryByRole("heading", { name: "No cards match the active filters" })
        ).not.toBeInTheDocument();
        // When: Exercise `replaceAuthSession` with the prepared inputs.
        replaceAuthSession({ status: "authenticated", uid: APP_STORY_UID, isAnonymous: true, displayName: null });
        // Then: Verify the expected result in the assertions below.
        await expect(await canvas.findByRole("button", { name: "View Hello" })).toBeVisible();
      }
    );
  },
};
