"use client";

import { useRef, useEffect } from "react";
import type { LogEntry } from "@/types/log-types";
import getLevelBadgeColor from "@/utils/log-utils";

interface LogDetailModalProps {
  log: LogEntry;
  isInFindings: boolean;
  addToFindings: () => void;
  removeFromFindings: () => void;
  onClose: () => void;
}

export function LogDetailModal({
  log,
  isInFindings,
  addToFindings,
  removeFromFindings,
  onClose,
}: LogDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="bg-white  rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200  flex justify-between items-center">
          <div className="flex items-center gap-4 p-2">
            <div className="flex flex-col items-center text-center space-y-2">
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${getLevelBadgeColor(
                  log.level
                )}`}>
                {log.level}
              </span>
              <p className="text-xs text-gray-500">Thread: {log.thread}</p>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Log Entry Details
            </h2>
            <div className="ml-auto">
              <p className="font-mono text-sm text-gray-600">
                {log.formattedTimestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700  ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-4">
              <div className="bg-gray-50  p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500  mb-2">
                  Class
                </h3>
                <p className="font-mono text-xs break-all">{log.className}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50  p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500  mb-2">
                  Method
                </h3>
                <p className="font-mono text-xs  overflow-auto">{log.method}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-gray-50  p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-500  mb-2">Logger</h3>
            <p className="font-mono text-xs bg-white  p-3 rounded border border-gray-200  max-h-[200px] overflow-auto">
              {log.logger}
            </p>
          </div>

          <div className="mt-4 bg-gray-50  p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-500  mb-2">Message</h3>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-white  p-3 rounded border border-gray-200  max-h-[200px] overflow-auto">
              {log.message}
            </pre>
          </div>
          {log.throwable !== "" && (
            <div className="mt-4 bg-gray-50  p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500  mb-2">
                Exception:
              </h3>
              <pre className="whitespace-pre-wrap font-mono text-sm bg-white  p-3 rounded border border-gray-200  max-h-[200px] overflow-auto">
                {log.throwable}
              </pre>
            </div>
          )}

          {Object.keys(log.properties).length > 0 && (
            <div className="mt-4 bg-gray-50  p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500  mb-2">
                Properties
              </h3>
              <div className="bg-white  p-3 rounded border border-gray-200  max-h-[200px] overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 ">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 ">
                    {Object.entries(log.properties).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 ">
                          {key}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500  break-all">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200  flex justify-between">
          <div>
            {!isInFindings ? (
              <button
                onClick={addToFindings}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Add to Findings
              </button>
            ) : (
              <button
                onClick={removeFromFindings}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Remove from Findings
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300  rounded-md hover:bg-gray-100 ">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
