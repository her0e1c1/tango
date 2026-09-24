import { auth } from "../firebase";

export type LocalWriteErrorHandler = (error: unknown) => void;

/** Anonymous writes stay local; their later failures still belong to the initiating caller. */
export async function settleFirestoreWrite(write: Promise<void>, onLocalError?: LocalWriteErrorHandler): Promise<void> {
  if (auth.currentUser?.isAnonymous && onLocalError !== undefined) {
    void write.catch(onLocalError);
    return;
  }
  await write;
}
