/** @file Defines reusable network behavior for Storybook stories. */

import { HttpResponse, http } from "msw";

export const STORYBOOK_DECK_IMPORT_URL = "https://storybook.tango.invalid/decks/starter.csv";

const storybookDeckImportCsv = `\
"Write a question in front text","Write the answer for it in back text","","question-answer-example"
"hello word in python","print('hello world')","python","hello-world-python"
"What is the area of a circle with a radius of r?","$\\pi r^2$","math","circle-area"`;

export const storybookHandlers = [
  http.get(STORYBOOK_DECK_IMPORT_URL, () =>
    HttpResponse.text(storybookDeckImportCsv, {
      headers: { "Content-Type": "text/csv; charset=utf-8" },
    })
  ),
];
