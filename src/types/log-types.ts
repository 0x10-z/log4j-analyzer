export interface SystemDetails {
  id: number;
  machineName: string | null;
  version: string | null;
  architecture: string | null;
  osName: string | null;
  osVersion: string | null;
  osType: string | null;
}

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
