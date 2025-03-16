import { SystemDetails } from "@/types/log-types";
import React, { useState } from "react";

interface SystemDetailsProps {
  details: SystemDetails;
}

const SystemDetailsCard: React.FC<SystemDetailsProps> = ({ details }) => {
  const [isOpen, setIsOpen] = useState(false); // Estado para el colapsable

  const toggleCollapse = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-white shadow-md rounded-lg border border-gray-200">
      {/* Cabecera con título y botón para expandir/colapsar */}
      <div
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={toggleCollapse}
      >
        <h2 className="text-lg font-bold text-gray-800">System Details</h2>
        <button
          className="text-gray-600 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 focus:outline-none"
          aria-expanded={isOpen}
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {/* Contenido colapsable */}
      {isOpen && (
        <div className="p-4 space-y-2 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Machine Name:</span>
            <span className="text-gray-800">
              {details.machineName || "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Version:</span>
            <span className="text-gray-800">{details.version || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Architecture:</span>
            <span className="text-gray-800">
              {details.architecture || "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">OS Name:</span>
            <span className="text-gray-800">{details.osName || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">OS Version:</span>
            <span className="text-gray-800">{details.osVersion || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">OS Type:</span>
            <span className="text-gray-800">{details.osType || "N/A"}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemDetailsCard;
