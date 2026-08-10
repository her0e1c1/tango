import { subscribeRemoteCollection } from "@/shared/firebase/remote-collection";
import type { RemoteSubscriptionProps } from "@/shared/lib/remote";

import type { Deck } from "../model/deck";
import { mapDeckDocument } from "./deckDto";

export const subscribeDeckReads = (props: RemoteSubscriptionProps<Deck>): (() => void) =>
  subscribeRemoteCollection("deck", props, mapDeckDocument);
