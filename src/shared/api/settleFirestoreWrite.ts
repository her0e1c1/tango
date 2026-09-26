import { auth } from "../firebase";

/** Anonymous writes stay local, so their SDK promises cannot wait for a server acknowledgement. */
export async function settleFirestoreWrite(write: Promise<void>): Promise<void> {
  if (auth.currentUser?.isAnonymous) {
    void write.catch(globalThis.reportError);
    return;
  }
  await write;
}
