import { io, events } from "./io";

export const downloadTextFile: typeof io.downloadTextFile = (...args) => {
  events.push({ name: "downloadTextFile", args: structuredClone(args.filter((value) => typeof value !== "function")) });
  return io.downloadTextFile(...args);
};
