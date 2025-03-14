import { useRef, useEffect } from "react";
import { LogEntry } from "../../types/log-types";
import getLevelBadgeColor from "../../utils/log-utils";

interface FindingsModalProps {
  findings: LogEntry[];
  removeFromFindings: (logId: number) => void;
  exportFindings: () => void;
  onClose: () => void;
}

export function FindingsModal({
  findings,
  removeFromFindings,
  exportFindings,
  onClose,
}: FindingsModalProps) {
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Findings ({findings.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
          {findings.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No findings yet. Click the star icon on log entries to add them to
              your findings.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {findings.map((log, index) => (
                  <tr
                    key={log.id}
                    className={
                      index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/50" : ""
                    }
                  >
                    <td className="px-4 py-2 whitespace-nowrap font-mono text-xs text-gray-900 dark:text-gray-300">
                      {log.formattedTimestamp}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getLevelBadgeColor(
                          log.level
                        )}`}
                      >
                        {log.level}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate text-gray-900 dark:text-gray-300"
                      title={log.className}
                    >
                      {log.className.split(".").pop()}
                    </td>
                    <td
                      className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate text-gray-900 dark:text-gray-300"
                      title={log.method}
                    >
                      {log.method}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-300">
                      {log.message}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <button
                        onClick={() => removeFromFindings(log.id)}
                        className="inline-flex items-center justify-center p-1 text-red-600 bg-red-100 rounded-full hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        title="Remove from findings"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={exportFindings}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-2"
            disabled={findings.length === 0}
          >
            Export Findings
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
