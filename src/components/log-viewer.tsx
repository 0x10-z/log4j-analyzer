"use client";

import type React from "react";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useDebounce } from "../hooks/use-debounce";
import type { LogEntry } from "../types/log-types";

interface LogViewerProps {
  logs: LogEntry[];
}

export function LogViewer({ logs }: LogViewerProps) {
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300); // 300ms debounce

  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof LogEntry>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // For virtualization
  const [visibleLogs, setVisibleLogs] = useState<LogEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // For findings feature
  const [findings, setFindings] = useState<LogEntry[]>([]);
  const [showFindings, setShowFindings] = useState(false);
  const [findingsModalOpen, setFindingsModalOpen] = useState(false);

  // Add a new state for the detail modal and selected log
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Extract unique values for filters from ALL logs (not just visible ones)
  const uniqueLevels = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.level)));
  }, [logs]);

  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.className)));
  }, [logs]);

  const uniqueMethods = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.method)));
  }, [logs]);

  // This function filters logs based on current filters
  const getFilteredLogs = useCallback(() => {
    // If showing findings, filter from findings list instead of all logs
    const sourceData = showFindings ? findings : logs;

    return sourceData.filter((log) => {
      const matchesLevel = levelFilter === "all" || log.level === levelFilter;
      const matchesClass =
        classFilter === "all" || log.className === classFilter;
      const matchesMethod =
        methodFilter === "all" || log.method === methodFilter;

      const matchesSearch =
        debouncedSearchText === "" ||
        log.message
          ?.toLowerCase()
          .includes(debouncedSearchText.toLowerCase()) ||
        log.className
          ?.toLowerCase()
          .includes(debouncedSearchText.toLowerCase()) ||
        log.method?.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
        log.formattedTimestamp
          ?.toLowerCase()
          .includes(debouncedSearchText.toLowerCase());

      return matchesLevel && matchesClass && matchesMethod && matchesSearch;
    });
  }, [
    logs,
    findings,
    showFindings,
    levelFilter,
    classFilter,
    methodFilter,
    debouncedSearchText,
  ]);

  // This function sorts logs based on current sort settings
  const getSortedLogs = useCallback(
    (filteredLogs: LogEntry[]) => {
      return [...filteredLogs].sort((a, b) => {
        const fieldA = a[sortField];
        const fieldB = b[sortField];

        if (typeof fieldA === "number" && typeof fieldB === "number") {
          return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA;
        }

        const strA = String(fieldA || "").toLowerCase();
        const strB = String(fieldB || "").toLowerCase();

        if (sortDirection === "asc") {
          return strA.localeCompare(strB);
        } else {
          return strB.localeCompare(strA);
        }
      });
    },
    [sortField, sortDirection]
  );

  // Update filtered logs when filters change
  useEffect(() => {
    setIsSearching(true);

    // Use setTimeout to avoid blocking the UI
    const timeoutId = setTimeout(() => {
      const filteredLogs = getFilteredLogs();
      const sortedLogs = getSortedLogs(filteredLogs);

      setTotalFilteredCount(filteredLogs.length);
      setVisibleLogs(sortedLogs.slice(0, 100)); // Initial batch of 100 logs
      setIsSearching(false);

      // Reset scroll position when filters change
      if (tableRef.current) {
        tableRef.current.scrollTop = 0;
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [
    logs,
    findings,
    showFindings,
    levelFilter,
    classFilter,
    methodFilter,
    debouncedSearchText,
    sortField,
    sortDirection,
    getFilteredLogs,
    getSortedLogs,
  ]);

  // Load more logs when scrolling
  const loadMoreLogs = useCallback(() => {
    if (isLoadingMore || visibleLogs.length >= totalFilteredCount) return;

    setIsLoadingMore(true);

    setTimeout(() => {
      const filteredLogs = getFilteredLogs();
      const sortedLogs = getSortedLogs(filteredLogs);

      setVisibleLogs((prev) => {
        const newLogs = sortedLogs.slice(0, prev.length + 100);
        return newLogs;
      });

      setIsLoadingMore(false);
    }, 0);
  }, [
    isLoadingMore,
    visibleLogs.length,
    totalFilteredCount,
    getFilteredLogs,
    getSortedLogs,
  ]);

  // Handle scroll to implement infinite scrolling
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        loadMoreLogs();
      }
    },
    [loadMoreLogs]
  );

  // Handle sort toggle
  const handleSort = (field: keyof LogEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchText("");
    setLevelFilter("all");
    setClassFilter("all");
    setMethodFilter("all");
  };

  // Highlight search text in content
  const highlightText = useCallback(
    (text: string) => {
      if (!debouncedSearchText || !text) return text;

      const parts = text.split(new RegExp(`(${debouncedSearchText})`, "gi"));

      return parts.map((part, i) =>
        part.toLowerCase() === debouncedSearchText.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-800">
            {part}
          </span>
        ) : (
          part
        )
      );
    },
    [debouncedSearchText]
  );

  // Export logs as JSON
  const exportLogs = () => {
    const filteredLogs = getFilteredLogs();
    const sortedLogs = getSortedLogs(filteredLogs);

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(sortedLogs, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "logs_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Get level badge color
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
    downloadAnchorNode.setAttribute("download", "findings_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Add a new function to handle row click
  const handleRowClick = (log: LogEntry) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  // Add useEffect to initialize dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (savedMode === "light") {
      document.documentElement.classList.remove("dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      // If no saved preference, use system preference
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search logs..."
            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {isSearching && (
            <div className="absolute right-2.5 top-2.5">
              <svg
                className="animate-spin h-4 w-4 text-gray-500"
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

        <div className="flex gap-2">
          <button
            className={`px-3 py-2 border rounded-md flex items-center gap-1 ${
              showFindings
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={toggleFindingsView}
            title={showFindings ? "Show all logs" : "Show findings only"}
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
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <span className="hidden sm:inline">
              {showFindings ? "All Logs" : "Findings"}
            </span>
            <span className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs font-semibold text-white bg-gray-500 rounded-full dark:bg-gray-700">
              {findings.length}
            </span>
          </button>

          <button
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={resetFilters}
            title="Reset filters"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <button
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={showFindings ? exportFindings : exportLogs}
            title={showFindings ? "Export findings" : "Export logs"}
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>

          <button
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setFindingsModalOpen(true)}
            title="View findings"
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="all">All levels</option>
              {uniqueLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
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
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="all">All classes</option>
              {uniqueClasses.map((className) => (
                <option key={className} value={className}>
                  {className.split(".").pop()}
                </option>
              ))}
            </select>
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
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">All methods</option>
              {uniqueMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {showFindings ? "Findings" : "Log Records"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalFilteredCount} records found{" "}
            {visibleLogs.length < totalFilteredCount
              ? `(showing ${visibleLogs.length})`
              : ""}
          </p>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {visibleLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
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
                  visibleLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      className={`${
                        index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/50" : ""
                      } hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer`}
                      onClick={() => handleRowClick(log)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap font-mono text-xs text-gray-900 dark:text-gray-300">
                        {highlightText(log.formattedTimestamp)}
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
                        {highlightText(log.className.split(".").pop() || "")}
                      </td>
                      <td
                        className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate text-gray-900 dark:text-gray-300"
                        title={log.method}
                      >
                        {highlightText(log.method)}
                      </td>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-300">
                        {highlightText(log.message)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        {isInFindings(log.id) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromFindings(log.id);
                            }}
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
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToFindings(log);
                            }}
                            className="inline-flex items-center justify-center p-1 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                            title="Add to findings"
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
                                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                              />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
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
      </div>

      {/* Findings Modal */}
      {findingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Findings ({findings.length})
              </h2>
              <button
                onClick={() => setFindingsModalOpen(false)}
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
                  No findings yet. Click the star icon on log entries to add
                  them to your findings.
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
                          index % 2 === 0
                            ? "bg-gray-50 dark:bg-gray-900/50"
                            : ""
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
                onClick={() => exportFindings()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-2"
                disabled={findings.length === 0}
              >
                Export Findings
              </button>
              <button
                onClick={() => setFindingsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {detailModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Log Entry Details</h2>
              <button
                onClick={() => setDetailModalOpen(false)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Timestamp
                    </h3>
                    <p className="font-mono text-sm">
                      {selectedLog.formattedTimestamp}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Level
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getLevelBadgeColor(
                        selectedLog.level
                      )}`}
                    >
                      {selectedLog.level}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Thread
                    </h3>
                    <p>{selectedLog.thread}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Class
                    </h3>
                    <p className="font-mono text-sm break-all">
                      {selectedLog.className}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Method
                    </h3>
                    <p className="font-mono text-sm">{selectedLog.method}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Logger
                    </h3>
                    <p className="font-mono text-sm break-all">
                      {selectedLog.logger}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Message
                </h3>
                <pre className="whitespace-pre-wrap font-mono text-sm bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 max-h-[200px] overflow-auto">
                  {selectedLog.message}
                </pre>
              </div>

              {Object.keys(selectedLog.properties).length > 0 && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Properties
                  </h3>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 max-h-[200px] overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {Object.entries(selectedLog.properties).map(
                          ([key, value]) => (
                            <tr key={key}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                                {key}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 break-all">
                                {value}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <div>
                {!isInFindings(selectedLog.id) ? (
                  <button
                    onClick={() => addToFindings(selectedLog)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
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
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                    Add to Findings
                  </button>
                ) : (
                  <button
                    onClick={() => removeFromFindings(selectedLog.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
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
                    Remove from Findings
                  </button>
                )}
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
