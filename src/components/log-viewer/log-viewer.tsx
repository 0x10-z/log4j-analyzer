import { useEffect, useState } from "react";
import type { LogEntry } from "@/types/log-types";
import { FilterBar } from "./filter-bar";
import { LogTable } from "./log-table";
import { LogDetailModal } from "./log-detail-modal";
import { ColumnSelector } from "./column-selector";
import { useLogFiltering } from "@/hooks/use-log-filtering";
import { DateTimeFilter } from "./date-time-filter";
import Select from "react-select";
import getLevelBadgeColor, {
  getLogsMinimumAndMaximumDate,
  parseDate,
} from "@/utils/log-utils";
import { Entry } from "@zip.js/zip.js";
import SystemDetailsView from "./system-details";

interface LogViewerProps {
  onLogsLoaded: (logs: LogEntry[]) => void;
  logs: LogEntry[];
  logFiles: { zipFilename: string; entries: Entry }[] | null;
}

export function LogViewer({
  onLogsLoaded,
  logs,
  logFiles: logFiles,
}: LogViewerProps) {
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
    levelFilter,
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

  const allLevelsOptions = [
    ...uniqueLevels.map((level) => ({
      value: level,
      label: (
        <span
          className={`px-2 py-1 text-xs rounded-full ${getLevelBadgeColor(
            level
          )}`}
        >
          {level}
        </span>
      ),
    })),
  ];

  const extractClassName = (totalClassName: string) => {
    const parts = totalClassName.includes(".")
      ? totalClassName.split(".")
      : [totalClassName];
    return {
      mainName: parts.pop() || "Unknown",
      restOfClass: parts.join("."),
    };
  };

  const allClassesOptions = [
    { value: "all", label: "All classes" },
    ...uniqueClasses
      .filter((className) => className && className.trim() !== "")
      .map((className) => {
        const { mainName, restOfClass } = extractClassName(className);

        return {
          value: className,
          mainName,
          restOfClass,
          label: (
            <div>
              <p className="text-xs text-gray-500">{restOfClass}</p>
              <span className="text-gray-800 font-bold">{mainName}</span>
            </div>
          ),
        };
      })
      .sort((a, b) => a.mainName.localeCompare(b.mainName)),
  ];

  const allMethodsOptions = [
    { value: "all", label: "All methods" },
    ...uniqueMethods
      .filter((method) => method && method.trim() !== "")
      .map((method) => {
        const [firstPart, ...rest] = method.includes(" ")
          ? method.split(" ")
          : [method];
        const methodResult = firstPart;
        const methodName = rest.length > 0 ? rest.join(" ") : "Unknown";
        const realMethodName = methodName.includes("(")
          ? methodName.split("(")[0]
          : methodName;

        const methodParameters = methodName.includes("(")
          ? methodName
              .split("(")[1]
              .split(",")
              .map((param) => param.trim())
              .filter((param) => param !== "")
          : [];

        const methodParametersWithoutTypes = methodParameters.map((param) => {
          const { mainName } = extractClassName(param);
          return mainName;
        });

        return {
          value: method,
          methodName: realMethodName,
          methodResult,
          methodParameters: methodParametersWithoutTypes,
          label: (
            <div>
              <p className="text-xs text-gray-500">{methodResult}</p>
              <span className="text-gray-800 font-bold">
                {realMethodName}({methodParametersWithoutTypes.join(", ")})
              </span>
            </div>
          ),
        };
      })
      .sort((a, b) => a.methodName.localeCompare(b.methodName)),
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
  const handleExternalSetTimestamp = (timestamp: number) => {
    const deltaTime = 2500; // 2.5 seconds * 2 of interval time.
    const date = new Date(timestamp);

    // Set the start to deltaTime second before the timestamp
    const start = new Date(date.getTime() - deltaTime);

    // Set the end to deltaTime second after the timestamp
    const end = new Date(date.getTime() + deltaTime);

    //console.log(`Timestamp: ${timestamp}`);
    //console.log(`Start: ${start.toISOString()}`);
    //console.log(`End: ${end.toISOString()}`);

    // Update the start and end times in state
    setStartDateTime(parseDate(start)); // Ensure parseDate formats the date correctly with seconds
    setEndDateTime(parseDate(end)); // Ensure parseDate formats the date correctly with seconds

    // Activate the filter
    setIsDateFilterActive(true);
  };

  return (
    <div className="space-y-4">
      <SystemDetailsView logs={logs} />
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
      <div className="grid grid-cols-12 gap-3 shadow-xl">
        {/* Level ocupa menos espacio */}
        <div className="col-span-3 bg-white p-4 rounded-lg shadow-md">
          <div className="pb-3 border-b border-gray-200">
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
              isMulti
              value={allLevelsOptions.filter((option) =>
                levelFilter.includes(option.value)
              )}
              onChange={(selectedOptions) => {
                const selectedValues = selectedOptions
                  ? selectedOptions.map((option) => option.value)
                  : [];
                setLevelFilter(selectedValues);
              }}
              placeholder="Select a level"
              menuPortalTarget={document.body}
              styles={{
                menu: (base) => ({ ...base, zIndex: 99 }),
              }}
            />
          </div>
        </div>

        {/* Class y Method ocupan más espacio */}
        <div className="col-span-4 bg-white  p-4 rounded-lg shadow-md">
          <div className="pb-3 border-b border-gray-200 ">
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
              styles={{ menu: (base) => ({ ...base, zIndex: 99 }) }}
            />
          </div>
        </div>

        <div className="col-span-5 bg-white  p-4 rounded-lg shadow-md">
          <div className="pb-3 border-b border-gray-200 ">
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
              styles={{ menu: (base) => ({ ...base, zIndex: 99 }) }}
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
        onLogsLoaded={onLogsLoaded}
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
        logFiles={logFiles}
        onSetTimestamp={handleExternalSetTimestamp}
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
