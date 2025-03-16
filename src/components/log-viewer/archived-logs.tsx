import { Entry } from "@zip.js/zip.js";
import Select from "react-select";

interface ArchivedLogsProps {
  archivedLogs: { zipFilename: string; entries: Entry }[] | null;
  allArchivedOptions: {
    value: { zipFilename: string; entries: Entry };
    label: string;
  }[];
  setSelectedArchivedFile: (entries: Entry | null) => void;
  selectedArchivedFile: Entry | null;
}

export const ArchivedLogs = ({
  archivedLogs,
  allArchivedOptions,
  setSelectedArchivedFile,
  selectedArchivedFile,
}: ArchivedLogsProps) => {
  return (
    <>
      <h2 className="text-lg font-semibold">
        Archived logs ({archivedLogs ? archivedLogs.length : 0})
      </h2>
      <Select
        className="w-full text-black"
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
        styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
      />
      {selectedArchivedFile && selectedArchivedFile.toString()}
    </>
  );
};
