const http = require("http");

const url = process.argv[2];
const maxAttempts = 120;
const intervalMs = 500;

let attempts = 0;

const wait = () => {
  attempts += 1;

  http
    .get(url, (response) => {
      response.resume();
      process.exit(0);
    })
    .on("error", () => {
      if (attempts >= maxAttempts) {
        console.error(`Timed out waiting for ${url}`);
        process.exit(1);
      }

      setTimeout(wait, intervalMs);
    });
};

wait();
