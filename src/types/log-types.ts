export interface LogEntry {
  id: number;
  timestamp: number;
  formattedTimestamp: string;
  level: string;
  logger: string;
  thread: string;
  message: string;
  throwable: string;
  className: string;
  method: string;
  properties: Record<string, string>;
}
