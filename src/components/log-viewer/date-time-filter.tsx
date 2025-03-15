import { useState, useEffect } from "react";
import { LogEntry } from "../../types/log-types";

interface DateTimeFilterProps {
  logs: LogEntry[];
  initialStartDate: string;
  initialEndDate: string;
  startDateTime: string;
  setStartDateTime: (value: string) => void;
  endDateTime: string;
  setEndDateTime: (value: string) => void;
  isDateFilterActive: boolean;
  setIsDateFilterActive: (value: boolean) => void;
}

export function DateTimeFilter({
  logs,
  initialStartDate,
  initialEndDate,
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime,
  isDateFilterActive,
  setIsDateFilterActive,
}: DateTimeFilterProps) {
  const [error, setError] = useState("");

  // Adjust start and end dates when the component mounts
  useEffect(() => {
    if (logs.length > 0) {
      setStartDateTime(initialStartDate);
      setEndDateTime(initialEndDate);
    }
  }, [
    logs,
    setStartDateTime,
    setEndDateTime,
    initialStartDate,
    initialEndDate,
  ]);

  // Sync changes in input fields
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    if (newStart < initialStartDate) {
      setError("The start date cannot be earlier than the allowed range.");
    } else if (newStart > endDateTime) {
      setError("The start date cannot be later than the selected end date.");
    } else {
      setError("");
      setStartDateTime(newStart);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    if (newEnd > initialEndDate) {
      setError("The end date cannot be later than the allowed range.");
    } else if (newEnd < startDateTime) {
      setError("The end date cannot be earlier than the selected start date.");
    } else {
      setError("");
      setEndDateTime(newEnd);
    }
  };

  // Restore initial dates if the user clears them
  const resetToInitialDates = () => {
    setStartDateTime(initialStartDate);
    setEndDateTime(initialEndDate);
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg max-w-lg mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          📆 Date & Time Filter
        </h2>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDateFilterActive}
            onChange={(e) => setIsDateFilterActive(e.target.checked)}
            className="w-5 h-5 text-blue-600 dark:text-blue-400 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Enable
          </span>
        </label>
      </div>

      <div className="flex flex-row w-full mt-4 space-x-4">
        {/* Start Date & Time Input */}
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={handleStartChange}
            disabled={!isDateFilterActive}
            min={initialStartDate}
            max={initialEndDate}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none 
                 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600"
          />
        </div>

        {/* End Date & Time Input */}
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date & Time
          </label>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={handleEndChange}
            disabled={!isDateFilterActive}
            min={initialStartDate}
            max={initialEndDate}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none 
                 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Restore Button */}
      <button
        onClick={resetToInitialDates}
        className="w-full mt-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      >
        Restore Initial Dates
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-red-500 text-sm font-medium bg-red-100 dark:bg-red-900 p-2 rounded-md">
          {error}
        </p>
      )}
    </div>
  );
}
