import { downloadTextFile } from "@/shared/files";

export const SAMPLE_CSV_TEXT = `\
"Write a question in front text","Write the answer for it in back text","","question-answer-example"
"hello word in python","print('hello world')","python","hello-world-python"
"What is the area of a circle with a radius of r?","$\\pi r^2$","math","circle-area"`;

const SAMPLE_CSV_FILE_NAME = "sample.csv";
const CSV_MIME_TYPE = "text/plain;charset=utf-8";

export const downloadSampleCsv = (): void => downloadTextFile(SAMPLE_CSV_TEXT, SAMPLE_CSV_FILE_NAME, CSV_MIME_TYPE);
