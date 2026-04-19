importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function handleRequest(event) {
  try {
    await scramjet.loadConfig();
  } catch (err) {
    console.warn("[sw] failed to load scramjet config, using native fetch:", err);
    return fetch(event.request);
  }

  const prefix = scramjet?.config?.prefix;
  if (typeof prefix !== "string" || prefix.length === 0) {
    return fetch(event.request);
  }

  try {
    if (scramjet.route(event)) {
      return await scramjet.fetch(event);
    }
  } catch (err) {
    // Some pages/assets can be requested before transport or config is fully ready.
    // Fall back to native fetch so requests do not hard-fail.
    console.warn("[sw] scramjet failed, fallback:", err);
  }

  return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});
