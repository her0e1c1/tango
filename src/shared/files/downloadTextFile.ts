import saveAs from "file-saver";

export const downloadTextFile = (content: string, fileName: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  saveAs(blob, fileName, { autoBom: false });
};
