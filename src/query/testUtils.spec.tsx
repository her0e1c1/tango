/**
 * @file Verifies the "Query test utilities" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "creates isolated clients
 * with retries disabled", "provides the requested client to rendered tests", "creates a
 * retry-disabled client when no client is supplied".
 */

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { createQueryWrapper, createTestQueryClient } from "@/query/testUtils";

describe("Query test utilities", () => {
  it("creates isolated clients with retries disabled", () => {
    const first = createTestQueryClient();
    const second = createTestQueryClient();

    first.setQueryData(["example"], "cached");

    expect(second).not.toBe(first);
    expect(second.getQueryData(["example"])).toBeUndefined();
    expect(first.getDefaultOptions().queries?.retry).toBe(false);
    expect(first.getDefaultOptions().mutations?.retry).toBe(false);
  });

  it("provides the requested client to rendered tests", () => {
    const client = createTestQueryClient();

    const Probe = () => {
      const providedClient = useQueryClient();
      return <span>{providedClient === client ? "provided" : "unexpected"}</span>;
    };

    render(<Probe />, { wrapper: createQueryWrapper(client) });

    expect(screen.getByText("provided")).toBeInTheDocument();
  });

  it("creates a retry-disabled client when no client is supplied", () => {
    const Probe = () => {
      const client = useQueryClient();
      const queryRetry = client.getDefaultOptions().queries?.retry;
      const mutationRetry = client.getDefaultOptions().mutations?.retry;
      return <span>{`${queryRetry}:${mutationRetry}`}</span>;
    };

    render(<Probe />, { wrapper: createQueryWrapper() });

    expect(screen.getByText("false:false")).toBeInTheDocument();
  });
});
