import React, { useState } from "react";

import { LogEntry } from "@/types/log-types";
import { extractBVCLog } from "@/utils/zip-utils";
import { Entry } from "@zip.js/zip.js";
import { parseXmlContent } from "@/utils/log-utils";

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

        setTimeout(() => {
          handleXmlParsing(xmlContent);
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

  async function handleXmlParsing(xmlContent: string) {
    try {
      setProgress(5); // Start process

      const logs = await parseXmlContent(xmlContent, 1000000, (progress) => {
        setProgress(progress); // Update progress
      });

      setProgress(100); // Complete process
      onLogsLoaded(logs);
    } catch (err) {
      setError("Error parsing the XML content");
      console.error(err);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <h3 className="text-xl font-semibold">Processing file...</h3>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-gray-600 h-2.5 rounded-full transition-all duration-300"
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
                ? "border-gray-500 bg-gray-50 dark:bg-gray-900/20"
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
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200">
                Drag & drop your log4j XML file
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                or click to select a file
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
