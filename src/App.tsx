import { useState } from "react";
import { FileUploader } from "@/components/file-uploader";
import { LogViewer } from "@/components/log-viewer/log-viewer";
import type { LogEntry } from "@/types/log-types";
import { Entry } from "@zip.js/zip.js";
import { Log4JExplanation } from "./components/log4j-explanation";

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFiles, setLogFiles] = useState<
    { zipFilename: string; entries: Entry }[] | null
  >(null);

  const handleLogsLoaded = (parsedLogs: LogEntry[]) => {
    setLogs(parsedLogs);
  };

  const handleLogFilesLoaded = (
    logFiles: { zipFilename: string; entries: Entry }[]
  ) => {
    setLogFiles(logFiles);
  };

  return (
    <main className="relative container mx-auto p-4 w-full sm:max-w-9xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Log4j XML Analyzer
      </h1>
      {logs.length === 0 ? (
        <>
          {/* GitHub Fork Me Ribbon */}
          <a
            href="https://github.com/0x10-z/log4j-analyzer"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed top-0 right-0 "
          >
            <img
              loading="lazy"
              decoding="async"
              className="z-0"
              width="149"
              height="149"
              src="https://github.blog/wp-content/uploads/2008/12/forkme_right_red_aa0000.png"
              alt="Fork me on GitHub"
            />
          </a>
          <FileUploader
            onLogsLoaded={handleLogsLoaded}
            onLogFilesLoaded={handleLogFilesLoaded}
          />
          <Log4JExplanation />
        </>
      ) : (
        <LogViewer
          onLogsLoaded={handleLogsLoaded}
          logs={logs}
          logFiles={logFiles}
        />
      )}
    </main>
  );
}

export default App;
