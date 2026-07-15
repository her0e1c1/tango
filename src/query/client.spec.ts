import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { queryClient } from "@/query/client";

describe("queryClient", () => {
  it("exports a production QueryClient singleton", async () => {
    const { queryClient: importedAgain } = await import("@/query/client");

    expect(queryClient).toBeInstanceOf(QueryClient);
    expect(importedAgain).toBe(queryClient);
    expect(queryClient.getDefaultOptions()).toEqual({});
  });
});
