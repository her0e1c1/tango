import { describe, expect, it } from "vitest";
import { getStudyHistoryChart } from "./getStudyHistoryChart";

const midnight = (date: string) => new Date(`${date}T00:00:00`).getTime();
const bucket = (start: string, end: string, started: number, completed: number) => ({
  date: midnight(start),
  endDate: midnight(end),
  started,
  completed,
});
function emptyDays(start: string, length: number) {
  return Array.from({ length }, (_, index) => {
    const date = new Date(`${start}T00:00:00`);
    date.setDate(date.getDate() + index);
    return { date: date.getTime(), started: 0, completed: 0 };
  });
}

describe("STUDY-SESSION-09 STUDY-SESSION-13 study history chart", () => {
  it("shows one start and completion on their date throughout the initial 30-day period", () => {
    const days = emptyDays("2026-03-02", 30);
    days[29] = { date: midnight("2026-03-31"), started: 1, completed: 1 };

    const chart = getStudyHistoryChart(days);

    expect(chart.bucketSize).toBe(1);
    expect(chart.buckets).toEqual([
      ...Array.from({ length: 29 }, (_, index) => {
        const date = new Date(2026, 2, index + 2).getTime();
        return { date, endDate: date, started: 0, completed: 0 };
      }),
      bucket("2026-03-31", "2026-03-31", 1, 1),
    ]);
    expect(Number.isFinite(chart.maximum)).toBe(true);
    expect(chart.maximum).toBeGreaterThanOrEqual(1);
  });

  it("sums independent counts into seven-day intervals and preserves the final partial interval", () => {
    const days = emptyDays("2026-01-01", 90);
    for (const [index, started, completed] of [
      [0, 1, 0],
      [6, 2, 1],
      [7, 0, 3],
      [8, 1, 1],
      [84, 4, 2],
      [89, 1, 0],
    ] as const) {
      days[index] = { date: days[index]!.date, started, completed };
    }

    const chart = getStudyHistoryChart(days);

    expect(chart.bucketSize).toBe(7);
    expect(chart.buckets).toEqual([
      bucket("2026-01-01", "2026-01-07", 3, 1),
      bucket("2026-01-08", "2026-01-14", 1, 4),
      bucket("2026-01-15", "2026-01-21", 0, 0),
      bucket("2026-01-22", "2026-01-28", 0, 0),
      bucket("2026-01-29", "2026-02-04", 0, 0),
      bucket("2026-02-05", "2026-02-11", 0, 0),
      bucket("2026-02-12", "2026-02-18", 0, 0),
      bucket("2026-02-19", "2026-02-25", 0, 0),
      bucket("2026-02-26", "2026-03-04", 0, 0),
      bucket("2026-03-05", "2026-03-11", 0, 0),
      bucket("2026-03-12", "2026-03-18", 0, 0),
      bucket("2026-03-19", "2026-03-25", 0, 0),
      bucket("2026-03-26", "2026-03-31", 5, 2),
    ]);
    expect(Number.isFinite(chart.maximum)).toBe(true);
    expect(chart.maximum).toBeGreaterThanOrEqual(5);
  });

  it.each([
    {
      preset: 7,
      start: "2026-03-25",
      expected: [
        bucket("2026-03-25", "2026-03-25", 0, 0),
        bucket("2026-03-26", "2026-03-26", 0, 0),
        bucket("2026-03-27", "2026-03-27", 0, 0),
        bucket("2026-03-28", "2026-03-28", 0, 0),
        bucket("2026-03-29", "2026-03-29", 0, 0),
        bucket("2026-03-30", "2026-03-30", 0, 0),
        bucket("2026-03-31", "2026-03-31", 0, 0),
      ],
      bucketSize: 1,
    },
    {
      preset: 90,
      start: "2026-01-01",
      expected: [
        bucket("2026-01-01", "2026-01-07", 0, 0),
        bucket("2026-01-08", "2026-01-14", 0, 0),
        bucket("2026-01-15", "2026-01-21", 0, 0),
        bucket("2026-01-22", "2026-01-28", 0, 0),
        bucket("2026-01-29", "2026-02-04", 0, 0),
        bucket("2026-02-05", "2026-02-11", 0, 0),
        bucket("2026-02-12", "2026-02-18", 0, 0),
        bucket("2026-02-19", "2026-02-25", 0, 0),
        bucket("2026-02-26", "2026-03-04", 0, 0),
        bucket("2026-03-05", "2026-03-11", 0, 0),
        bucket("2026-03-12", "2026-03-18", 0, 0),
        bucket("2026-03-19", "2026-03-25", 0, 0),
        bucket("2026-03-26", "2026-03-31", 0, 0),
      ],
      bucketSize: 7,
    },
  ])("does not invent counts in the empty $preset-day preset", ({ preset, start, expected, bucketSize }) => {
    const chart = getStudyHistoryChart(emptyDays(start, preset));

    expect(chart.bucketSize).toBe(bucketSize);
    expect(chart.buckets).toEqual(expected);
    expect(Number.isFinite(chart.maximum)).toBe(true);
    expect(chart.maximum).toBeGreaterThanOrEqual(0);
  });
});
