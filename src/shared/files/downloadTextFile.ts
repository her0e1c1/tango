import * as FileSaver from "file-saver";

export const downloadTextFile = (content: string, fileName: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  FileSaver.saveAs(blob, fileName);
};
