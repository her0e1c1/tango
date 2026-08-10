import { subscribeRemoteCollection } from "@/shared/firebase/remote-collection";
import type { RemoteSubscriptionProps } from "@/shared/lib/remote";

import type { Card } from "../model/card";
import { mapCardDocument } from "./cardDto";

export const subscribeCardReads = (props: RemoteSubscriptionProps<Card>): (() => void) =>
  subscribeRemoteCollection("card", props, mapCardDocument);
