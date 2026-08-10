/**
 * Storybook-specific MSW bootstrap.
 *
 * Static assets bypass MSW so interrupted dev-server requests do not reject inside MSW's
 * passthrough handler. Fetch and XHR requests still reach the generated worker for API mocking.
 */
self.addEventListener("fetch", (event) => {
  if (event.request.destination !== "") {
    event.stopImmediatePropagation();
  }
});

importScripts("./mockServiceWorker.js");
