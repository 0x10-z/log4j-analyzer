import { useState, useEffect } from "react";
import Select from "react-select";
import { BlobWriter, Entry } from "@zip.js/zip.js";
import {
  getLogsMinimumAndMaximumDate,
  parseXmlContent,
} from "@/utils/log-utils";
import { LogEntry } from "@/types/log-types";

interface LogFilesProps {
  onLogsLoaded: (logs: LogEntry[]) => void;

  logFiles: { zipFilename: string; entries: Entry }[] | null;
  logFilesOptions: {
    value: { zipFilename: string; entries: Entry };
    label: string;
  }[];
  setSelectedArchivedFile: (entries: Entry | null) => void;
  selectedArchivedFile: Entry | null;
}

export const LogFiles = ({
  onLogsLoaded,
  logFiles: logFiles,
  logFilesOptions: allArchivedOptions,
  setSelectedArchivedFile,
  selectedArchivedFile,
}: LogFilesProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    // Trigger file loading whenever `selectedArchivedFile` changes
    const loadFile = async () => {
      if (!selectedArchivedFile) return;

      try {
        setIsLoading(true);
        setError(null);
        setLoadProgress(0);

        const blob = await selectedArchivedFile.getData?.(
          new BlobWriter("text/xml")
        );

        if (!blob) {
          throw new Error("Failed to retrieve the file data.");
        }

        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const xmlContent = e.target?.result as string;

            const logs = await parseXmlContent(
              xmlContent,
              100000,
              (progress) => {
                setTimeout(() => {
                  setLoadProgress(progress);
                }, 0);
              }
            );

            if (logs.length > 0) {
              const { start, end } = getLogsMinimumAndMaximumDate(logs);
              onLogsLoaded(logs);
              setStartDate(new Date(start).toLocaleString());
              setEndDate(new Date(end).toLocaleString());
            }
          } catch (parseError) {
            setError("Failed to parse the XML content.");
            console.error(parseError);
          } finally {
            setIsLoading(false);
          }
        };

        reader.onerror = () => {
          setError("Error reading the file.");
          console.error("Error reading the file.");
          setIsLoading(false);
        };

        reader.readAsText(blob);
      } catch (err) {
        setError("An error occurred while loading the file.");
        console.error(err);
        setIsLoading(false);
      }
    };

    if (selectedArchivedFile) {
      loadFile();
    }
  }, [selectedArchivedFile]);

  return (
    <div className="archived-logs max-w-2xl min-w-[400px] mx-auto">
      {" "}
      <h2 className="text-lg font-semibold mb-4 text-center">
        All Logs files ({logFiles ? logFiles.length : 0})
      </h2>
      <Select
        className="w-full text-black mb-4"
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
        styles={{
          container: (base) => ({
            ...base,
            width: "100%",
          }),
          menu: (base) => ({ ...base, zIndex: 9999 }),
        }}
      />
      {/* Loading State */}
      {isLoading ? (
        <div className="mt-4">
          <p className="text-gray-800 text-sm mb-2 text-center">
            ({loadProgress}%) Loading files, please wait...
          </p>
          <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden shadow">
            <div
              className="absolute top-0 left-0 h-full bg-gray-700 transition-width duration-300"
              style={{ width: `${loadProgress}%` }}></div>
          </div>
        </div>
      ) : (
        startDate &&
        endDate && (
          <p className="text-sm text-gray-500  mt-4 text-center">
            Logs from <strong>{startDate}</strong> to <strong>{endDate}</strong>
            .
          </p>
        )
      )}
      {/* Error State */}
      {error && (
        <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
};
