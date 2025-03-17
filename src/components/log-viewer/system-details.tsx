import React from "react";
import { LogEntry } from "@/types/log-types";
import { extractSystemDetails } from "@/utils/log-utils";

interface SystemDetailsProps {
  logs: LogEntry[];
}

const SystemDetailsView: React.FC<SystemDetailsProps> = ({ logs }) => {
  const { machineName, version, architecture, osName, osVersion, osType } =
    extractSystemDetails(logs) || {};

  const hasDetails =
    machineName || version || architecture || osName || osVersion || osType;

  const errors = logs.filter((log) => log.level == "ERROR").length;
  const warnings = logs.filter((log) => log.level == "WARN").length;

  if (!hasDetails) return null; // Don't render if no details

  return (
    <div className="bg-white shadow-md rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {machineName && (
            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset">
              Machine: {machineName}
            </span>
          )}
          {version && (
            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
              Version: {version}
            </span>
          )}
          {architecture && (
            <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-700/10 ring-inset">
              Arch: {architecture}
            </span>
          )}
          {osName && (
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-700/10 ring-inset">
              OS: {osName}
            </span>
          )}
          {osVersion && (
            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset">
              OS Ver: {osVersion}
            </span>
          )}
          {osType && (
            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
              OS Type: {osType}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {errors > 0 && (
            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
              Errors ({errors})
            </span>
          )}

          {warnings > 0 && (
            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-red-600/10 ring-inset">
              Warnings ({warnings})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemDetailsView;
