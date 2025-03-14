import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { LogEntry } from "../types/log-types";
import { useDebounce } from "./use-debounce";

export function useLogFiltering(
  logs: LogEntry[],
  findings: LogEntry[],
  showFindings: boolean
) {
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300); // 300ms debounce

  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof LogEntry>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Date/time filter
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);

  // For virtualization
  const [visibleLogs, setVisibleLogs] = useState<LogEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

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

      // Date/time filter
      let matchesDateRange = true;
      if (isDateFilterActive && startDateTime && endDateTime) {
        const logDate = new Date(log.timestamp);
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);

        matchesDateRange = logDate >= startDate && logDate <= endDate;
      }

      return (
        matchesLevel &&
        matchesClass &&
        matchesMethod &&
        matchesSearch &&
        matchesDateRange
      );
    });
  }, [
    logs,
    findings,
    showFindings,
    levelFilter,
    classFilter,
    methodFilter,
    debouncedSearchText,
    startDateTime,
    endDateTime,
    isDateFilterActive,
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
    startDateTime,
    endDateTime,
    isDateFilterActive,
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
    setStartDateTime("");
    setEndDateTime("");
    setIsDateFilterActive(false);
  };

  return {
    searchText,
    setSearchText,
    levelFilter,
    setLevelFilter,
    classFilter,
    setClassFilter,
    methodFilter,
    setMethodFilter,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
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
  };
}
