/**
 * @file Provides React Query test setup shared by component and hook specifications.
 * Tests receive an isolated query client and provider wrapper without repeating cache defaults or
 * provider wiring.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

/**
 * Creates and configures a test query client.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

/**
 * Creates and configures a query wrapper.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createQueryWrapper = (queryClient: QueryClient = createTestQueryClient()) => {
  /**
   * Renders the Query Wrapper user interface.
   * Wraps test children with the isolated QueryClient created by the surrounding test helper.
   */
  const QueryWrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return QueryWrapper;
};
