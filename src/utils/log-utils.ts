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

export const parseDate = (date: Date): string => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
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

const parseLogEvent = (event: Element, index: number): LogEntry => {
  const timestamp = event.getAttribute("timestamp");
  const level = event.getAttribute("level");
  const logger = event.getAttribute("logger");
  const thread = event.getAttribute("thread");

  // Get message
  const messageElements = event.getElementsByTagName("log4j:message");
  const message =
    messageElements.length > 0 ? messageElements[0].textContent : "";

  // Get location info
  const locationElements = event.getElementsByTagName("log4j:locationInfo");
  const className =
    locationElements.length > 0
      ? locationElements[0].getAttribute("class")
      : "";
  const method =
    locationElements.length > 0
      ? locationElements[0].getAttribute("method")
      : "";

  // Get properties
  const propertiesElements = event.getElementsByTagName("log4j:properties");
  const properties: Record<string, string> = {};

  if (propertiesElements.length > 0) {
    const dataElements =
      propertiesElements[0].getElementsByTagName("log4j:data");
    for (let j = 0; j < dataElements.length; j++) {
      const name = dataElements[j].getAttribute("name");
      const value = dataElements[j].getAttribute("value");
      if (name && value) {
        properties[name] = value;
      }
    }
  }

  return {
    id: index,
    timestamp: timestamp ? Number.parseInt(timestamp) : 0,
    formattedTimestamp:
      properties["Sender Timestamp"] ||
      new Date(Number.parseInt(timestamp || "0")).toISOString(),
    level: level || "",
    logger: logger || "",
    thread: thread || "",
    message: message || "",
    className: className || "",
    method: method || "",
    properties,
  };
};

export async function parseXmlContent(
  xmlContent: string,
  chunkSize: number = 1000000,
  onProgress?: (progress: number) => void
): Promise<LogEntry[]> {
  const totalSize = xmlContent.length;
  const allLogs: LogEntry[] = [];

  if (totalSize > chunkSize * 5) {
    let processedChunks = 0;
    const totalChunks = Math.ceil(totalSize / chunkSize);

    const processNextChunk = async (startIndex: number): Promise<void> => {
      const endIndex = Math.min(startIndex + chunkSize, totalSize);
      const chunk = xmlContent.substring(startIndex, endIndex);

      // Manejo del primer y último chunk
      let processableChunk = chunk;
      if (startIndex > 0) {
        const firstEventIndex = chunk.indexOf("<log4j:event");
        if (firstEventIndex > 0) {
          processableChunk = chunk.substring(firstEventIndex);
        }
      }
      if (endIndex < totalSize) {
        const lastEventEndIndex =
          processableChunk.lastIndexOf("</log4j:event>");
        if (lastEventEndIndex > 0) {
          processableChunk = processableChunk.substring(
            0,
            lastEventEndIndex + 14
          );
        }
      }

      // Parsear el chunk
      const wrappedXml = `<root>${processableChunk}</root>`;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(wrappedXml, "text/xml");
      const logEvents = xmlDoc.getElementsByTagName("log4j:event");

      for (let i = 0; i < logEvents.length; i++) {
        const log = parseLogEvent(logEvents[i], allLogs.length);
        allLogs.push(log);
      }

      processedChunks++;

      // Llama al callback de progreso (si está disponible)
      if (onProgress) {
        const progress = Math.min(
          95,
          Math.round((processedChunks / totalChunks) * 100)
        );
        onProgress(progress);
      }

      if (endIndex < totalSize) {
        await processNextChunk(endIndex);
      }
    };

    // Iniciar el procesamiento por chunks
    await processNextChunk(0);
  } else {
    const wrappedXml = `<root>${xmlContent}</root>`;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(wrappedXml, "text/xml");
    const logEvents = xmlDoc.getElementsByTagName("log4j:event");

    for (let i = 0; i < logEvents.length; i++) {
      const log = parseLogEvent(logEvents[i], i);
      allLogs.push(log);
    }
  }

  return allLogs;
}
