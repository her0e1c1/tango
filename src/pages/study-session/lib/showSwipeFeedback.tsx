import { AiOutlineArrowDown, AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineArrowUp } from "react-icons/ai";
import type { SwipeDirection } from "@/entities/preference";
import { showToast, type ToastTone } from "@/shared/ui/toast";

const swipeFeedbackPresentation = {
  cardSwipeUp: { icon: AiOutlineArrowUp, labelKey: "studySession.feedback.swipedUp" },
  cardSwipeDown: { icon: AiOutlineArrowDown, labelKey: "studySession.feedback.swipedDown" },
  cardSwipeLeft: { icon: AiOutlineArrowLeft, labelKey: "studySession.feedback.swipedLeft" },
  cardSwipeRight: { icon: AiOutlineArrowRight, labelKey: "studySession.feedback.swipedRight" },
} as const satisfies Record<SwipeDirection, { icon: typeof AiOutlineArrowUp; labelKey: string }>;

const SWIPE_FEEDBACK_DURATION_MS = 900;
const SWIPE_FEEDBACK_TONE = "neutral" satisfies ToastTone;

export function showSwipeFeedback(direction: SwipeDirection): void {
  const { icon: Icon, labelKey } = swipeFeedbackPresentation[direction];
  showToast({
    messageKey: labelKey,
    visualContent: (
      <Icon
        aria-hidden="true"
        className="text-3xl"
        data-swipe-feedback-direction={direction}
        data-testid="swipe-feedback-direction"
      />
    ),
    tone: SWIPE_FEEDBACK_TONE,
    durationMs: SWIPE_FEEDBACK_DURATION_MS,
    dismissible: false,
  });
}
