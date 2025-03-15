import { useEffect, useState } from "react";
import type { LogEntry } from "@/types/log-types";
import { FilterBar } from "./filter-bar";
import { LogTable } from "./log-table";
import { LogDetailModal } from "./log-detail-modal";
import { ColumnSelector } from "./column-selector";
import { useLogFiltering } from "@/hooks/use-log-filtering";
import { DateTimeFilter } from "./date-time-filter";
import Select from "react-select";
import { getLogsMinimumAndMaximumDate } from "@/utils/log-utils";
import { Entry } from "@zip.js/zip.js";

interface LogViewerProps {
  logs: LogEntry[];
  archivedLogs: { zipFilename: string; entries: Entry }[] | null;
}

export function LogViewer({ logs, archivedLogs }: LogViewerProps) {
  // For findings feature
  const [findings, setFindings] = useState<LogEntry[]>([]);
  const [showFindings, setShowFindings] = useState(false);

  // For detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // For column selection
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
      actions: true,
      timestamp: true,
      level: true,
      className: true,
      method: true,
      message: true,
    }
  );

  // Use the custom hook for filtering and sorting
  const {
    searchText,
    setSearchText,
    setLevelFilter,
    setClassFilter,
    setMethodFilter,
    sortField,
    //setSortField,
    sortDirection,
    //setSortDirection,
    startDateTime,
    setStartDateTime,
    endDateTime,
    setEndDateTime,
    isDateFilterActive,
    setIsDateFilterActive,
    visibleLogs,
    isSearching,
    totalFilteredCount,
    isLoadingMore,
    tableRef,
    handleScroll,
    handleSort,
    resetFilters,
    uniqueLevels,
    uniqueClasses,
    uniqueMethods,
  } = useLogFiltering(logs, findings, showFindings);

  // Add log to findings
  const addToFindings = (log: LogEntry) => {
    // Check if log is already in findings
    if (!findings.some((finding) => finding.id === log.id)) {
      setFindings((prev) => [...prev, log]);
    }
  };

  // Remove log from findings
  const removeFromFindings = (logId: number) => {
    setFindings((prev) => prev.filter((finding) => finding.id !== logId));
  };

  // Check if log is in findings
  const isInFindings = (logId: number) => {
    return findings.some((finding) => finding.id === logId);
  };

  // Toggle findings view
  const toggleFindingsView = () => {
    setShowFindings((prev) => !prev);
  };

  // Export findings as JSON
  const exportFindings = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(findings, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `findings_export_${new Date().toISOString()}.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Handle row click to show detail modal
  const handleRowClick = (log: LogEntry) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const allMethodsOptions = [
    { value: "all", label: "All methods" },
    ...uniqueMethods.map((method) => ({
      value: method,
      label: method,
    })),
  ];

  const allLevelsOptions = [
    { value: "all", label: "All levels" },
    ...uniqueLevels.map((method) => ({
      value: method,
      label: method,
    })),
  ];

  const allClassesOptions = [
    { value: "all", label: "All classes" },
    ...uniqueClasses.map((method) => ({
      value: method,
      label: method,
    })),
  ];

  const [initialStartDate, setInitialStartDate] = useState<string>("");
  const [initialEndDate, setInitialEndDate] = useState<string>("");

  useEffect(() => {
    if (logs.length > 0) {
      const { start, end } = getLogsMinimumAndMaximumDate(logs);

      setInitialStartDate(start);
      setInitialEndDate(end);

      setStartDateTime(start);
      setEndDateTime(end);
    }
  }, [logs, setStartDateTime, setEndDateTime]);

  return (
    <div className="space-y-4">
      <FilterBar
        searchText={searchText}
        setSearchText={setSearchText}
        isSearching={isSearching}
        showFindings={showFindings}
        toggleFindingsView={toggleFindingsView}
        findingsCount={findings.length}
        resetFilters={resetFilters}
        exportData={() => (showFindings ? exportFindings() : null)}
        openColumnSelector={() => setColumnSelectorOpen(true)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shadow-xl">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium flex items-center gap-2">
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Level
            </h3>
          </div>
          <div className="pt-3">
            <Select
              className="w-full text-black"
              options={allLevelsOptions}
              onChange={(selected) => setLevelFilter(selected?.value || "all")}
              placeholder="Select a level"
              menuPortalTarget={document.body}
              styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium flex items-center gap-2">
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Class
            </h3>
          </div>
          <div className="pt-3">
            <Select
              className="w-full text-black"
              options={allClassesOptions}
              onChange={(selected) => setClassFilter(selected?.value || "all")}
              placeholder="Select a class"
              menuPortalTarget={document.body}
              styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium flex items-center gap-2">
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Method
            </h3>
          </div>
          <div className="pt-3">
            <Select
              className="w-full text-black"
              options={allMethodsOptions}
              onChange={(selected) => setMethodFilter(selected?.value || "all")}
              placeholder="Select a method"
              menuPortalTarget={document.body}
              styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        </div>
      </div>
      <div>
        <DateTimeFilter
          logs={logs}
          initialStartDate={initialStartDate}
          initialEndDate={initialEndDate}
          startDateTime={startDateTime}
          setStartDateTime={setStartDateTime}
          endDateTime={endDateTime}
          setEndDateTime={setEndDateTime}
          isDateFilterActive={isDateFilterActive}
          setIsDateFilterActive={setIsDateFilterActive}
        />
      </div>
      <LogTable
        visibleLogs={visibleLogs}
        isSearching={isSearching}
        isLoadingMore={isLoadingMore}
        totalFilteredCount={totalFilteredCount}
        tableRef={tableRef}
        handleScroll={handleScroll}
        handleSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        handleRowClick={handleRowClick}
        isInFindings={isInFindings}
        addToFindings={addToFindings}
        removeFromFindings={removeFromFindings}
        showFindings={showFindings}
        searchText={searchText}
        visibleColumns={visibleColumns}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        archivedLogs={archivedLogs}
      />

      {detailModalOpen && selectedLog && (
        <LogDetailModal
          log={selectedLog}
          isInFindings={isInFindings(selectedLog.id)}
          addToFindings={() => addToFindings(selectedLog)}
          removeFromFindings={() => removeFromFindings(selectedLog.id)}
          onClose={() => setDetailModalOpen(false)}
        />
      )}

      {columnSelectorOpen && (
        <ColumnSelector
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          onClose={() => setColumnSelectorOpen(false)}
        />
      )}
    </div>
  );
}
