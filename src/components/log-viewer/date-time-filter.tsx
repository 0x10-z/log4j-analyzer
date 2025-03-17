import { useState, useEffect } from "react";
import { LogEntry } from "@/types/log-types";

interface DateTimeFilterProps {
  logs: LogEntry[];
  initialStartDate: string; // Initial start date (ISO 8601 format)
  initialEndDate: string; // Initial end date (ISO 8601 format)
  startDateTime: string; // Controlled state for start date and time
  setStartDateTime: (value: string) => void; // Function to update start date and time
  endDateTime: string; // Controlled state for end date and time
  setEndDateTime: (value: string) => void; // Function to update end date and time
  isDateFilterActive: boolean; // Indicates if the date filter is active
  setIsDateFilterActive: (value: boolean) => void; // Function to toggle the date filter state
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
  const [error, setError] = useState(""); // Local state for error messages

  // Set initial start and end dates when the component mounts
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

  // Handle changes to the start date input
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    if (newStart < initialStartDate) {
      setError("The start date cannot be earlier than the allowed range.");
    } else if (newStart > endDateTime) {
      setError("The start date cannot be later than the selected end date.");
    } else {
      setError("");
      setStartDateTime(newStart); // Update the start date
    }
  };

  // Handle changes to the end date input
  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    if (newEnd > initialEndDate) {
      setError("The end date cannot be later than the allowed range.");
    } else if (newEnd < startDateTime) {
      setError("The end date cannot be earlier than the selected start date.");
    } else {
      setError("");
      setEndDateTime(newEnd); // Update the end date
    }
  };

  // Reset the start and end dates to their initial values
  const resetToInitialDates = () => {
    setStartDateTime(initialStartDate);
    setEndDateTime(initialEndDate);
  };

  return (
    <div className="bg-white  p-6 rounded-xl shadow-lg max-w-lg mx-auto">
      {/* Header with title and enable/disable toggle */}
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-lg font-semibold text-gray-800 ">
          📆 Date & Time Filter
        </h2>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDateFilterActive} // Controls whether the filter is active
            onChange={(e) => setIsDateFilterActive(e.target.checked)}
            className="w-5 h-5 text-blue-600  focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700 ">Enable</span>
        </label>
      </div>

      {/* Inputs for start and end date/time */}
      <div className="flex flex-row w-full mt-4 space-x-4">
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700  mb-1">
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            step="1" // Allow seconds
            value={startDateTime} // Controlled value
            onChange={handleStartChange}
            disabled={!isDateFilterActive} // Disable if filter is not active
            min={initialStartDate} // Minimum allowed value
            max={initialEndDate} // Maximum allowed value
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900   "
          />
        </div>

        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700  mb-1">
            End Date & Time
          </label>
          <input
            type="datetime-local"
            step="1" // Allow seconds
            value={endDateTime} // Controlled value
            onChange={handleEndChange}
            disabled={!isDateFilterActive} // Disable if filter is not active
            min={initialStartDate} // Minimum allowed value
            max={initialEndDate} // Maximum allowed value
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900   "
          />
        </div>
      </div>

      {/* Button to restore initial dates */}
      <button
        onClick={resetToInitialDates}
        className="w-full mt-2 bg-gray-200  text-gray-800  py-2 px-4 rounded-lg hover:bg-gray-300  transition">
        Restore Initial Dates
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-red-500 text-sm font-medium bg-red-100  p-2 rounded-md">
          {error}
        </p>
      )}
    </div>
  );
}
