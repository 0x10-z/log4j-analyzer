import { useState } from "react";
import { FileUploader } from "@/components/file-uploader";
import { LogViewer } from "@/components/log-viewer/log-viewer";
import type { LogEntry } from "@/types/log-types";

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const handleLogsLoaded = (parsedLogs: LogEntry[]) => {
    setLogs(parsedLogs);
  };
  return (
    <main className="container mx-auto p-4 max-w-9xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Log4j XML Analyzer
      </h1>

      {logs.length === 0 ? (
        <FileUploader onLogsLoaded={handleLogsLoaded} />
      ) : (
        <LogViewer logs={logs} />
      )}
    </main>
  );
}

export default App;
