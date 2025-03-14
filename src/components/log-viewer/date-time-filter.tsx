import { useState, useMemo, useEffect, useRef } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { format, parseISO, isValid, addHours } from "date-fns";

interface DateTimeFilterProps {
  startDateTime: string;
  setStartDateTime: (value: string) => void;
  endDateTime: string;
  setEndDateTime: (value: string) => void;
  isDateFilterActive: boolean;
  setIsDateFilterActive: (value: boolean) => void;
}

const factor = 10000;

export function DateTimeFilter({
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime,
  isDateFilterActive,
  setIsDateFilterActive,
}: DateTimeFilterProps) {
  const minDate = isValid(parseISO(startDateTime))
    ? parseISO(startDateTime)
    : new Date();
  const maxDate = isValid(parseISO(endDateTime))
    ? parseISO(endDateTime)
    : addHours(new Date(), 6);

  // Convertir timestamps a segundos
  const minTimestamp = Math.floor(minDate.getTime() / factor);
  const maxTimestamp = Math.floor(maxDate.getTime() / factor);

  const [selectedRange, setSelectedRange] = useState<[number, number]>([
    minTimestamp,
    maxTimestamp,
  ]);

  const isSliding = useRef(false);

  const formattedSelectedTimes = useMemo(() => {
    return selectedRange.map((timestamp) =>
      format(new Date(timestamp * factor), "yyyy-MM-dd HH:mm")
    );
  }, [selectedRange]);

  const handleSliderChange = (value: [number, number]) => {
    const [newMin, newMax] = value;
    console.log(newMin, newMax);

    if (newMin >= newMax) return;

    isSliding.current = true;
    setSelectedRange(value);

    setStartDateTime(format(new Date(newMin * factor), "yyyy-MM-dd'T'HH:mm"));
    setEndDateTime(format(new Date(newMax * factor), "yyyy-MM-dd'T'HH:mm"));
  };

  useEffect(() => {
    if (isSliding.current) {
      isSliding.current = false;
      return;
    }

    const newMin = isValid(parseISO(startDateTime))
      ? Math.floor(parseISO(startDateTime).getTime() / factor)
      : minTimestamp;
    const newMax = isValid(parseISO(endDateTime))
      ? Math.floor(parseISO(endDateTime).getTime() / factor)
      : maxTimestamp;

    setSelectedRange([newMin, newMax]);
  }, [startDateTime, endDateTime]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <div className="pb-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-medium">🕒 Select Date & Time Range</h3>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enable-date-filter"
            checked={isDateFilterActive}
            onChange={(e) => setIsDateFilterActive(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="enable-date-filter"
            className="ml-2 text-sm text-gray-700 dark:text-gray-300"
          >
            Enable
          </label>
        </div>
      </div>

      <div className="pt-3 space-y-3">
        {/* Slider */}
        <Slider
          range
          min={minTimestamp}
          max={maxTimestamp}
          value={selectedRange}
          onChange={(value) => handleSliderChange(value as [number, number])}
          step={6} // Precisión de 1 minuto en segundos
          disabled={!isDateFilterActive}
          className="mt-4"
          trackStyle={[{ backgroundColor: "#4A90E2" }]}
          handleStyle={[
            { backgroundColor: "#FF6F61", borderColor: "#FF6F61" },
            { backgroundColor: "#50E3C2", borderColor: "#50E3C2" },
          ]}
        />

        {/* Mostrar fechas seleccionadas */}
        <div className="flex justify-between text-sm mt-2">
          <span className="text-red-500">{formattedSelectedTimes[0]}</span>
          <span className="text-green-500">{formattedSelectedTimes[1]}</span>
        </div>
      </div>
    </div>
  );
}
