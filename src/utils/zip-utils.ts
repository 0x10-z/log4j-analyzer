import { ZipReader, BlobReader, BlobWriter, Entry } from "@zip.js/zip.js";

export async function extractFilesFromZip(file: File): Promise<Entry[] | null> {
  try {
    const zipReader = new ZipReader(new BlobReader(file));
    const entries: Entry[] = await zipReader.getEntries();
    await zipReader.close();
    return entries;
  } catch (error) {
    console.error("Error reading ZIP file:", error);
    return null;
  }
}

export async function extractArchivedLogsFromZipFile(
  entries: Entry[]
): Promise<{ zipFilename: string; entries: Entry }[] | null> {
  try {
    const archivedFiles: { zipFilename: string; entries: Entry }[] = [];

    for (const entry of entries) {
      if (entry.filename.endsWith(".zip")) {
        const zipBlob = await entry.getData?.(new BlobWriter("zip"));
        if (zipBlob) {
          const file = new File([zipBlob], entry.filename, {
            type: zipBlob.type,
          });
          const nestedEntries = await extractFilesFromZip(file);
          if (nestedEntries) {
            archivedFiles.push({
              zipFilename: entry.filename,
              entries: nestedEntries[0],
            });
          }
        }
      }
    }

    return archivedFiles;
  } catch (error) {
    console.error("Error reading archived ZIP files:", error);
    return null;
  }
}

export async function extractBVCLog(file: File): Promise<{
  mainLog: Blob;
  archiveLogs: {
    zipFilename: string;
    entries: Entry;
  }[];
} | null> {
  try {
    const entries = await extractFilesFromZip(file);
    if (!entries) {
      return null;
    }

    const entry = entries.find((e) => e.filename === "log\\BVC.xml");
    if (!entry) {
      console.error("Error: 'log/BVC.xml' file does not exists in ZIP.");
      return null;
    }

    const archiveEntries = entries.filter((e) =>
      e.filename.startsWith("log\\Archives\\")
    );

    let fileOfArchivedEntries;
    if (archiveEntries.length > 0) {
      fileOfArchivedEntries = await extractArchivedLogsFromZipFile(
        archiveEntries
      );
    }

    const blob = await entry.getData?.(new BlobWriter("text/xml"));

    if (!blob) {
      console.error("Error: 'log/BVC.xml' cannot be extracted.");
      return null;
    }

    return {
      mainLog: blob,
      archiveLogs: fileOfArchivedEntries || [],
    };
  } catch (error) {
    console.error("Error reading ZIP file:", error);
    return null;
  }
}
