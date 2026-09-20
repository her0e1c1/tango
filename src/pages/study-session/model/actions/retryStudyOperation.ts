import { studySessionPageStore } from "../store";
import { executeStudyOperation } from "./executeStudyOperation";

export async function retryStudyOperation(): Promise<void> {
  const { pendingOperation } = studySessionPageStore.getState();
  if (pendingOperation !== undefined) await executeStudyOperation(pendingOperation);
}
