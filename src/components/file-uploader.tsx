import type React from "react";
import { useState } from "react";

import { LogEntry } from "@/types/log-types";
import { extractBVCLog } from "@/utils/zip-utils";
import { Entry } from "@zip.js/zip.js";

interface FileUploaderProps {
  onLogsLoaded: (logs: LogEntry[]) => void;
  onArchivedLogsLoaded: (
    archivedLogs: { zipFilename: string; entries: Entry }[]
  ) => void;
}

export function FileUploader({
  onLogsLoaded,
  onArchivedLogsLoaded,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    setProgress(0);

    if (!file.name.endsWith(".xml") && !file.name.endsWith(".ram")) {
      setError("Please upload an XML or Compressed file: " + file.name);
      setIsLoading(false);
      return;
    }

    // Simulate progress for large files
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentLoaded = Math.round((event.loaded / event.total) * 100);
        setProgress(percentLoaded);
      }
    };

    reader.onload = (e) => {
      try {
        clearInterval(progressInterval);
        setProgress(95); // Almost done, now parsing

        const xmlContent = e.target?.result as string;

        // Use a worker for large files if available
        setTimeout(() => {
          parseXmlContent(xmlContent);
          setProgress(100);
          setIsLoading(false);
        }, 0);
      } catch (err) {
        clearInterval(progressInterval);
        setError("Error processing the XML file");
        console.error(err);
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      clearInterval(progressInterval);
      setError("Error reading the file");
      setIsLoading(false);
    };

    if (file.name.endsWith(".ram")) {
      const result = await extractBVCLog(file);
      if (result && result.mainLog) {
        reader.readAsText(result.mainLog);
      } else {
        clearInterval(progressInterval);
        setError("log/BVC.xml file not found in the compressed file");
        setIsLoading(false);
      }

      if (result && result.archiveLogs) {
        onArchivedLogsLoaded(result.archiveLogs);
      }
    } else {
      reader.readAsText(file);
    }
  };

  const parseXmlContent = (xmlContent: string) => {
    try {
      // Process in chunks for large files
      const chunkSize = 1000000; // 1MB chunks
      const totalSize = xmlContent.length;

      // For very large files, we'll process in chunks
      if (totalSize > chunkSize * 5) {
        let processedChunks = 0;
        const totalChunks = Math.ceil(totalSize / chunkSize);
        const allLogs: LogEntry[] = [];

        const processNextChunk = (startIndex: number) => {
          const endIndex = Math.min(startIndex + chunkSize, totalSize);
          const chunk = xmlContent.substring(startIndex, endIndex);

          // If this is not the first chunk, we need to find a complete log entry
          let processableChunk = chunk;
          if (startIndex > 0) {
            const firstEventIndex = chunk.indexOf("<log4j:event");
            if (firstEventIndex > 0) {
              processableChunk = chunk.substring(firstEventIndex);
            }
          }

          // If this is not the last chunk, find the last complete log entry
          if (endIndex < totalSize) {
            const lastEventEndIndex =
              processableChunk.lastIndexOf("</log4j:event>");
            if (lastEventEndIndex > 0) {
              processableChunk = processableChunk.substring(
                0,
                lastEventEndIndex + 14
              ); // 14 is the length of '</log4j:event>'
            }
          }

          // Parse this chunk
          const wrappedXml = `<root>${processableChunk}</root>`;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(wrappedXml, "text/xml");

          // Get all log4j:event elements
          const logEvents = xmlDoc.getElementsByTagName("log4j:event");

          for (let i = 0; i < logEvents.length; i++) {
            const log = parseLogEvent(logEvents[i], allLogs.length);
            allLogs.push(log);
          }

          processedChunks++;
          setProgress(
            Math.min(95, Math.round((processedChunks / totalChunks) * 90))
          );

          // Process next chunk or finish
          if (endIndex < totalSize) {
            setTimeout(() => processNextChunk(endIndex), 0);
          } else {
            onLogsLoaded(allLogs);
          }
        };

        // Start processing chunks
        processNextChunk(0);
      } else {
        // For smaller files, process all at once
        const wrappedXml = `<root>${xmlContent}</root>`;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(wrappedXml, "text/xml");

        // Get all log4j:event elements
        const logEvents = xmlDoc.getElementsByTagName("log4j:event");
        const parsedLogs: LogEntry[] = [];

        for (let i = 0; i < logEvents.length; i++) {
          const log = parseLogEvent(logEvents[i], i);
          parsedLogs.push(log);
        }

        onLogsLoaded(parsedLogs);
      }
    } catch (err) {
      setError("Error parsing the XML content");
      console.error(err);
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

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <h3 className="text-xl font-medium">Processing file...</h3>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {progress < 100 ? `${progress}% complete` : "Finalizing..."}
            </p>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <h3 className="text-xl font-medium">
                Drag and drop your log4j XML file
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Or click to select a file
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".xml"
                  onChange={handleFileChange}
                />
                <div className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors">
                  Select file
                </div>
              </label>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
