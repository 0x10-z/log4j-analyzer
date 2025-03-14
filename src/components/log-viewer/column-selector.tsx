import { useRef, useEffect } from "react";

interface ColumnSelectorProps {
  visibleColumns: Record<string, boolean>;
  setVisibleColumns: (columns: Record<string, boolean>) => void;
  onClose: () => void;
}

export function ColumnSelector({
  visibleColumns,
  setVisibleColumns,
  onClose,
}: ColumnSelectorProps) {
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

  const toggleColumn = (column: string) => {
    setVisibleColumns({
      ...visibleColumns,
      [column]: !visibleColumns[column],
    });
  };

  const columnLabels: Record<string, string> = {
    actions: "Actions",
    timestamp: "Timestamp",
    level: "Level",
    className: "Class",
    method: "Method",
    message: "Message",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Select Visible Columns</h2>
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

        {/* Grid de botones */}
        <div className="p-4 grid grid-cols-2 gap-2">
          {Object.entries(visibleColumns).map(([column, isVisible]) => (
            <button
              key={column}
              onClick={() => toggleColumn(column)}
              className={`w-full min-w-[100px] px-4 py-2 rounded-md transition-colors text-center text-sm font-medium 
                ${
                  isVisible
                    ? "bg-gray-800 text-white hover:bg-gray-900"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
            >
              {columnLabels[column] || column}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-900 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
