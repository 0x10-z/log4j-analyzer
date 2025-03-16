import React, { useState } from "react";
import { LogEntry } from "@/types/log-types";
import Select from "react-select";
import { Entry } from "@zip.js/zip.js";
import { TableEntry } from "./log-table-entry";
import { ContextMenu } from "../context-menu";

interface LogTableProps {
  visibleLogs: LogEntry[];
  isSearching: boolean;
  isLoadingMore: boolean;
  totalFilteredCount: number;
  tableRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  handleSort: (field: keyof LogEntry) => void;
  sortField: keyof LogEntry;
  sortDirection: "asc" | "desc";
  handleRowClick: (log: LogEntry) => void;
  isInFindings: (logId: number) => boolean;
  addToFindings: (log: LogEntry) => void;
  removeFromFindings: (logId: number) => void;
  showFindings: boolean;
  searchText: string;
  visibleColumns: Record<string, boolean>;
  initialStartDate: string;
  initialEndDate: string;
  archivedLogs?: { zipFilename: string; entries: Entry }[] | null;
}

export function LogTable({
  visibleLogs,
  isSearching,
  isLoadingMore,
  totalFilteredCount,
  tableRef,
  handleScroll,
  handleSort,
  sortField,
  sortDirection,
  handleRowClick,
  isInFindings,
  addToFindings,
  removeFromFindings,
  showFindings,
  searchText,
  visibleColumns,
  initialStartDate,
  initialEndDate,
  archivedLogs,
}: LogTableProps) {
  const startDate = new Date(initialStartDate).toLocaleString();
  const endDate = new Date(initialEndDate).toLocaleString();

  const [selectedArchivedFile, setSelectedArchivedFile] =
    React.useState<Entry | null>(null);
  const allArchivedOptions = archivedLogs
    ? archivedLogs.map((log) => ({
        value: log,
        label: log.zipFilename,
      }))
    : [];

  const [menuData, setMenuData] = useState({
    visible: false,
    position: { x: 0, y: 0 },
    options: [] as { label: React.ReactNode; action: () => void }[],
  });

  const openContextMenu = (
    position: { x: number; y: number },
    options: { label: React.ReactNode; action: () => void }[]
  ) => {
    setMenuData({ visible: true, position, options });
  };

  const closeContextMenu = () => setMenuData({ ...menuData, visible: false });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex flex-row justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <h2 className="text-lg font-semibold">
            {showFindings ? "Findings" : "Log Records"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalFilteredCount} records found{" "}
            {visibleLogs.length < totalFilteredCount
              ? `(showing ${visibleLogs.length})`
              : ""}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This file contains logs from <strong>{startDate}</strong> to{" "}
            <strong>{endDate}</strong>
          </p>
        </div>
        <div className="p-4">
          <h2 className="text-lg font-semibold">
            Archived logs ({archivedLogs ? archivedLogs.length : 0})
          </h2>
          <Select
            className="w-full text-black"
            options={allArchivedOptions}
            onChange={(selected) => {
              if (selected?.value) {
                setSelectedArchivedFile(selected.value.entries);
              } else {
                setSelectedArchivedFile(null);
              }
            }}
            placeholder="Select an archived file"
            menuPortalTarget={document.body}
            styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
          />
          {selectedArchivedFile && selectedArchivedFile.toString()}
        </div>
      </div>
      <div className="p-4">
        <div
          ref={tableRef}
          className="rounded-md border border-gray-200 dark:border-gray-700 overflow-auto max-h-[600px]"
          onScroll={handleScroll}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
              <tr>
                {visibleColumns.actions && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                )}
                {visibleColumns.timestamp && (
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("formattedTimestamp")}
                  >
                    <div className="flex items-center gap-1">
                      Timestamp
                      {sortField === "formattedTimestamp" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.level && (
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("level")}
                  >
                    <div className="flex items-center gap-1">
                      Level
                      {sortField === "level" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.className && (
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("className")}
                  >
                    <div className="flex items-center gap-1">
                      Class
                      {sortField === "className" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.method && (
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("method")}
                  >
                    <div className="flex items-center gap-1">
                      Method
                      {sortField === "method" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.message && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {visibleLogs.length === 0 ? (
                <tr key="empty-state">
                  <td
                    colSpan={
                      Object.values(visibleColumns).filter(Boolean).length
                    }
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {isSearching ? (
                      <div className="flex justify-center items-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-3 text-gray-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Searching logs...
                      </div>
                    ) : (
                      "No records match your filters"
                    )}
                  </td>
                </tr>
              ) : (
                visibleLogs.map((log) => (
                  <TableEntry
                    key={log.id}
                    log={log}
                    visibleColumns={visibleColumns}
                    handleRowClick={handleRowClick}
                    addToFindings={addToFindings}
                    removeFromFindings={removeFromFindings}
                    isInFindings={isInFindings}
                    searchText={searchText}
                    handleSetTimestamp={(a) => console.log(a)}
                    openContextMenu={(e, options) =>
                      openContextMenu({ x: e.clientX, y: e.clientY }, options)
                    }
                  />
                ))
              )}
            </tbody>
          </table>

          {isLoadingMore && visibleLogs.length > 0 && (
            <div className="p-4 flex justify-center">
              <svg
                className="animate-spin h-5 w-5 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </div>
      </div>
      {/* Context Menu */}
      <ContextMenu
        visible={menuData.visible}
        position={menuData.position}
        options={menuData.options}
        onClose={closeContextMenu}
      />
    </div>
  );
}
