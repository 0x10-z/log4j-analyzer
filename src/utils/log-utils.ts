import { LogEntry, SystemDetails } from "@/types/log-types";
import { DOMParser } from "xmldom";

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

  // Get throwable (if exists)
  const throwableElements = event.getElementsByTagName("log4j:throwable");
  const throwable =
    throwableElements.length > 0 ? throwableElements[0].textContent : "";

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
    throwable: throwable || "", // Añadido para incluir información del throwable
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
  let processedChunks = 0;
  let remainingFragment = ""; // Fragmento incompleto de eventos anteriores
  const totalChunks = Math.ceil(totalSize / chunkSize);

  const processNextChunk = async (startIndex: number): Promise<void> => {
    const endIndex = Math.min(startIndex + chunkSize, totalSize);
    let chunk = xmlContent.substring(startIndex, endIndex);

    // Combinar fragmento sobrante con el chunk actual
    chunk = remainingFragment + chunk;
    remainingFragment = "";

    // Asegurar que el chunk comienza con un evento completo
    const firstEventIndex = chunk.indexOf("<log4j:event");
    if (firstEventIndex > 0) {
      remainingFragment = chunk.substring(0, firstEventIndex); // Guardar datos previos por seguridad
      chunk = chunk.substring(firstEventIndex);
    }

    // Manejar el fragmento incompleto al final del chunk
    const lastEventEndIndex = chunk.lastIndexOf("</log4j:event>");
    if (lastEventEndIndex > -1 && lastEventEndIndex + 14 < chunk.length) {
      remainingFragment = chunk.substring(lastEventEndIndex + 14); // Guardar fragmento incompleto
      chunk = chunk.substring(0, lastEventEndIndex + 14); // Ajustar chunk para procesar eventos completos
    }

    // Parsear el chunk ajustado
    const wrappedXml = `<root>${chunk}</root>`;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(wrappedXml, "text/xml");
    const logEvents = xmlDoc.getElementsByTagName("log4j:event");

    for (let i = 0; i < logEvents.length; i++) {
      const log = parseLogEvent(logEvents[i], allLogs.length);
      allLogs.push(log);
    }

    processedChunks++;

    // Actualizar el progreso
    if (onProgress) {
      const progress = Math.min(
        95,
        Math.round((processedChunks / totalChunks) * 100)
      );
      onProgress(progress);
    }

    if (endIndex < totalSize) {
      // Ceder control a la UI
      await new Promise((resolve) => setTimeout(resolve, 0));
      await processNextChunk(endIndex);
    }
  };

  // Procesar los chunks del archivo
  await processNextChunk(0);

  // Procesar cualquier fragmento restante (si existe)
  if (remainingFragment.trim().length > 0) {
    const wrappedXml = `<root>${remainingFragment}</root>`;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(wrappedXml, "text/xml");
    const logEvents = xmlDoc.getElementsByTagName("log4j:event");

    for (let i = 0; i < logEvents.length; i++) {
      const log = parseLogEvent(logEvents[i], allLogs.length);
      allLogs.push(log);
    }
  }

  return allLogs;
}

export function extractSystemDetails(logEntries: LogEntry[]): SystemDetails {
  const softwareNameRegex =
    /BySoftCellControlCut\s([\d.]+-\w+)\s\((Amd64|x86)\)/i;
  const osNameRegex = /OSName:\s(.+?)(?=\n|$)/i;
  const osVersionRegex = /OSVersion:\s([\d.]+)/i;
  const osTypeRegex = /OSType:\s(64 Bit|32 Bit)/i;

  const extractedDetails: SystemDetails = {
    id: 0, // Inicializamos con valores por defecto
    machineName: null,
    version: null,
    architecture: null,
    osName: null,
    osVersion: null,
    osType: null,
  };

  logEntries.forEach((log) => {
    if (!extractedDetails.id) {
      extractedDetails.id = log.id; // Se asigna el primer ID encontrado.
    }

    let machineName = "";
    Object.entries(log.properties).map(([key, value]) => {
      if (key === "log4jmachinename") {
        machineName = value;
      }
    });

    const machineNameMatch = log.message.match(softwareNameRegex);
    const osNameMatch = log.message.match(osNameRegex);
    const osVersionMatch = log.message.match(osVersionRegex);
    const osTypeMatch = log.message.match(osTypeRegex);

    if (machineNameMatch) {
      extractedDetails.machineName = machineName;
      extractedDetails.version = machineNameMatch[1];
      extractedDetails.architecture = machineNameMatch[2];
    }

    if (osNameMatch && !extractedDetails.osName) {
      extractedDetails.osName = osNameMatch[1];
    }

    if (osVersionMatch && !extractedDetails.osVersion) {
      extractedDetails.osVersion = osVersionMatch[1];
    }

    if (osTypeMatch && !extractedDetails.osType) {
      extractedDetails.osType = osTypeMatch[1];
    }
  });

  return extractedDetails;
}
