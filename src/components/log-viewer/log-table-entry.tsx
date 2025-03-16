import { useHighlightText } from "@/hooks/use-highlight-text";
import { LogEntry } from "@/types/log-types";
import getLevelBadgeColor from "@/utils/log-utils";
import { FaTimes } from "react-icons/fa";
import { MdOutlineMore } from "react-icons/md";
import { LuFilter } from "react-icons/lu";
import { MdFavoriteBorder } from "react-icons/md";

interface LogTableEntryProps {
  log: LogEntry;
  visibleColumns: Record<string, boolean>;
  handleRowClick: (log: LogEntry) => void;
  isInFindings: (logId: number) => boolean;
  addToFindings: (log: LogEntry) => void;
  removeFromFindings: (logId: number) => void;
  searchText: string;
  handleSetTimestamp: (timestamp: string) => void;
  openContextMenu: (
    e: React.MouseEvent,
    options: { label: React.ReactNode; action: () => void }[]
  ) => void;
}

export const TableEntry = ({
  log,
  visibleColumns,
  handleRowClick,
  isInFindings,
  addToFindings,
  removeFromFindings,
  searchText,
  handleSetTimestamp,
  openContextMenu,
}: LogTableEntryProps) => {
  const highlightText = useHighlightText(searchText);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e, [
      {
        label: (
          <>
            <MdOutlineMore className="inline-block mr-2" /> Open
          </>
        ),
        action: () => {
          handleRowClick(log);
        },
      },
      {
        label: (
          <>
            <LuFilter className="inline-block mr-2" color="#2196F3" /> Set
            timestamp to filter
          </>
        ),
        action: () => {
          console.log("Setting timestamp:", log.formattedTimestamp);
          handleSetTimestamp(log.formattedTimestamp);
        },
      },
      isInFindings(log.id)
        ? {
            label: (
              <>
                <FaTimes className="inline-block mr-2" color="#F44336" /> Remove
                from findings
              </>
            ),
            action: () => {
              removeFromFindings(log.id);
            },
          }
        : {
            label: (
              <>
                <MdFavoriteBorder className="inline-block mr-2 " color="blue" />{" "}
                Add to findings
              </>
            ),
            action: () => {
              addToFindings(log);
            },
          },
    ]);
  };

  return (
    <tr
      key={log.id}
      className={`${
        log.id % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/50" : ""
      } hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer`}
      onClick={handleContextMenu}
    >
      {visibleColumns.actions && (
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
      )}

      {visibleColumns.timestamp && (
        <td className="px-4 py-2 whitespace-nowrap font-mono text-xs text-gray-900 dark:text-gray-300">
          {highlightText(log.formattedTimestamp)}
        </td>
      )}

      {visibleColumns.level && (
        <td className="px-4 py-2 whitespace-nowrap">
          <span
            className={`px-2 py-1 text-xs rounded-full ${getLevelBadgeColor(
              log.level
            )}`}
          >
            {log.level}
          </span>
        </td>
      )}

      {visibleColumns.className && (
        <td
          className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate text-gray-900 dark:text-gray-300"
          title={log.className}
        >
          {highlightText(log.className.split(".").pop() || "")}
        </td>
      )}

      {visibleColumns.method && (
        <td
          className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate text-gray-900 dark:text-gray-300"
          title={log.method}
        >
          {highlightText(log.method)}
        </td>
      )}

      {visibleColumns.message && (
        <td className="px-4 py-2 text-gray-900 dark:text-gray-300 max-w-lg break-words whitespace-normal">
          {highlightText(log.message)}
        </td>
      )}
    </tr>
  );
};
