import { LogEntry } from "@/types/log-types";

const getLevelBadgeColor = (level: string) => {
  switch (level) {
    case "DEBUG":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "INFO":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "WARN":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "ERROR":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "FATAL":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export default getLevelBadgeColor;

const parseDate = (date: Date): string => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export const getLogsMinimumAndMaximumDate = (logs: LogEntry[]) => {
  const timestamps = logs
    .map((log) => new Date(log.timestamp).getTime())
    .filter((ts) => !isNaN(ts))
    .sort((a, b) => a - b);

  if (timestamps.length > 0) {
    const firstTimestamp = new Date(timestamps[0] - 1000 * 60); // Subtract 1 min
    const lastTimestamp = new Date(
      timestamps[timestamps.length - 1] + 1000 * 60
    ); // Add 1 min

    const adjustedStart = parseDate(firstTimestamp);
    const adjustedEnd = parseDate(lastTimestamp);

    return {
      start: adjustedStart,
      end: adjustedEnd,
    };
  } else {
    throw new Error("No valid timestamps found in the logs.");
  }
};
