import saveAs from "file-saver";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { downloadTextFile } from "@/shared/files";
import { createBlobConstructor } from "@/test/factories";

vi.mock("file-saver", () => ({ default: vi.fn() }));

describe("downloadTextFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("downloads the supplied text with its file metadata", () => {
    const blob = new Blob();
    const blobConstructor = vi.spyOn(globalThis, "Blob");
    blobConstructor.mockImplementation(createBlobConstructor(blob));

    downloadTextFile("contents", "example.txt", "text/plain;charset=utf-8");

    expect(blobConstructor).toHaveBeenCalledWith(["contents"], { type: "text/plain;charset=utf-8" });
    expect(saveAs).toHaveBeenCalledWith(blob, "example.txt");
  });
});
