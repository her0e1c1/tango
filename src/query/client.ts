/**
 * @file Provides shared remote-data behavior for Client.
 * Feature hooks use this layer to read and update Firestore data without owning cache or
 * subscription details.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();
