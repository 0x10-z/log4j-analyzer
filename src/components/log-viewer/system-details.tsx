import React from "react";

interface SystemDetailsProps {
  details: {
    machineName?: string;
    version?: string;
    architecture?: string;
    osName?: string;
    osVersion?: string;
    osType?: string;
  };
}

const SystemDetails: React.FC<SystemDetailsProps> = ({ details }) => {
  const { machineName, version, architecture, osName, osVersion, osType } =
    details || {};

  const hasDetails =
    machineName || version || architecture || osName || osVersion || osType;

  if (!hasDetails) return null; // Don't render if no details

  return (
    <div className="bg-white shadow-md rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-2">
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
    </div>
  );
};

export default SystemDetails;
