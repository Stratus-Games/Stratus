importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function shouldCoerceDocumentHtml(event, response) {
  if (!response || response.type === "opaque" || response.type === "opaqueredirect") {
    return false;
  }

  const isNavigation =
    event.request.mode === "navigate" ||
    event.request.destination === "document" ||
    event.request.destination === "iframe";
  if (!isNavigation) return false;

  if (!event.request.url.includes("/service/scramjet/")) return false;
  if (response.status < 200 || response.status >= 300) return false;

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  return contentType.length === 0 || contentType.startsWith("text/plain");
}

function coerceDocumentHtml(event, response) {
  if (!shouldCoerceDocumentHtml(event, response)) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

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
      const response = await scramjet.fetch(event);
      return coerceDocumentHtml(event, response);
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
