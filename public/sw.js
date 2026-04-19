importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function isScramjetDocumentRequest(event) {
  const destination = event.request.destination;
  const isDocumentLike =
    event.request.mode === "navigate" ||
    destination === "document" ||
    destination === "iframe";

  return isDocumentLike && event.request.url.includes("/service/scramjet/");
}

async function coerceMislabeledHtml(event, response) {
  if (!response || response.type === "opaque" || response.type === "opaqueredirect") {
    return response;
  }

  if (!isScramjetDocumentRequest(event)) {
    return response;
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const isMislabeled = contentType.length === 0 || contentType.startsWith("text/plain");
  if (!isMislabeled) {
    return response;
  }

  let snippet = "";
  try {
    snippet = (await response.clone().text()).slice(0, 512).toLowerCase();
  } catch {
    return response;
  }

  const looksLikeHtml =
    snippet.includes("<!doctype html") ||
    snippet.includes("<html") ||
    snippet.includes("<head") ||
    snippet.includes("<body");

  if (!looksLikeHtml) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.delete("x-content-type-options");

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
      return await coerceMislabeledHtml(event, response);
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
