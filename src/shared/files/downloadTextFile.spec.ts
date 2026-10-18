import saveAs from "file-saver";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createBlobConstructor } from "@/test/factories";

import { downloadTextFile } from ".";

vi.mock("file-saver", () => ({ default: vi.fn() }));

describe("downloadTextFile", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    vi.clearAllMocks();
  });

  it("downloads the supplied text with its file metadata", () => {
    // Given: Prepare `blob`, `blobConstructor` and any shared test state below.
    const blob = new Blob();
    const blobConstructor = vi.spyOn(global, "Blob");
    blobConstructor.mockImplementation(createBlobConstructor(blob));

    // When: Exercise `downloadTextFile` with the prepared inputs.
    downloadTextFile("contents", "example.txt", "text/plain;charset=utf-8");

    // Then: Verify the expected result in the assertions below.
    expect(blobConstructor).toHaveBeenCalledWith(["contents"], { type: "text/plain;charset=utf-8" });
    expect(saveAs).toHaveBeenCalledWith(blob, "example.txt", { autoBom: false });
  });
});
