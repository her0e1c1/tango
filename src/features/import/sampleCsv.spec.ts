import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ downloadTextFile: vi.fn() }));

vi.mock("@/shared/files", () => ({ downloadTextFile: mocks.downloadTextFile }));

import { downloadSampleCsv, SAMPLE_CSV_TEXT } from "@/features/import/sampleCsv";

describe("sample CSV", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the bundled sample content and download metadata", () => {
    expect(SAMPLE_CSV_TEXT).toBe(`\
"Write a question in front text","Write the answer for it in back text","","question-answer-example"
"hello word in python","print('hello world')","python","hello-world-python"
"What is the area of a circle with a radius of r?","$\\pi r^2$","math","circle-area"`);

    downloadSampleCsv();

    expect(mocks.downloadTextFile).toHaveBeenCalledExactlyOnceWith(
      SAMPLE_CSV_TEXT,
      "sample.csv",
      "text/plain;charset=utf-8"
    );
  });
});
