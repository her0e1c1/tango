export function getStudyHistoryChart(days: { date: number; started: number; completed: number }[]) {
  const bucketSize =
    days.length <= 31 ? 1 : days.length <= 180 ? 7 : days.length <= 366 ? 30 : Math.ceil(days.length / 24);
  const buckets: { date: number; endDate: number; started: number; completed: number }[] = [];
  for (let index = 0; index < days.length; index += bucketSize) {
    const group = days.slice(index, index + bucketSize);
    const first = group[0];
    const last = group.at(-1);
    if (!first || !last) continue;
    buckets.push({
      date: first.date,
      endDate: last.date,
      started: group.reduce((sum, day) => sum + day.started, 0),
      completed: group.reduce((sum, day) => sum + day.completed, 0),
    });
  }
  const maximum = Math.ceil(Math.max(2, ...buckets.flatMap((bucket) => [bucket.started, bucket.completed])) / 2) * 2;
  const tickCount = Math.min(4, days.length);
  const ticks = Array.from(
    { length: tickCount },
    (_, index) => days[Math.round((index * (days.length - 1)) / Math.max(1, tickCount - 1))]?.date ?? 0
  );
  return { buckets, bucketSize, maximum, ticks };
}
