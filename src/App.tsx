import { useState } from "react";
import { FileUploader } from "@/components/file-uploader";
import { LogViewer } from "@/components/log-viewer/log-viewer";
import type { LogEntry } from "@/types/log-types";
import { Entry } from "@zip.js/zip.js";

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [archivedLogs, setArchivedLogs] = useState<
    { zipFilename: string; entries: Entry }[] | null
  >(null);

  const handleLogsLoaded = (parsedLogs: LogEntry[]) => {
    setLogs(parsedLogs);
  };

  const handleArchivedLogsLoaded = (
    archivedLogs: { zipFilename: string; entries: Entry }[]
  ) => {
    setArchivedLogs(archivedLogs);
  };

  return (
    <main className="container mx-auto p-4 w-full sm:max-w-9xl">
      {" "}
      <h1 className="text-3xl font-bold mb-6 text-center">
        Log4j XML Analyzer
      </h1>
      {logs.length === 0 ? (
        <FileUploader
          onLogsLoaded={handleLogsLoaded}
          onArchivedLogsLoaded={handleArchivedLogsLoaded}
        />
      ) : (
        <LogViewer logs={logs} archivedLogs={archivedLogs} />
      )}
    </main>
  );
}

export default App;
