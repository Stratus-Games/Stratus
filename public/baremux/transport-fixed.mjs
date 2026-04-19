import BareClient from "/bare-transport/index.mjs?v=1";

function normalizeHeaderPairs(headers) {
  if (!headers) return [];

  if (Array.isArray(headers)) {
    return headers
      .filter((entry) => Array.isArray(entry) && entry.length >= 2)
      .map(([key, value]) => [String(key), String(value)]);
  }

  if (headers instanceof Headers) {
    return Array.from(headers.entries());
  }

  if (typeof headers[Symbol.iterator] === "function") {
    return Array.from(headers, ([key, value]) => [String(key), String(value)]);
  }

  if (typeof headers === "object") {
    return Object.entries(headers).map(([key, value]) => [String(key), String(value)]);
  }

  return [];
}

export default class SafeBareClient extends BareClient {
  async request(remote, method, body, headers, signal) {
    return super.request(remote, method, body, normalizeHeaderPairs(headers), signal);
  }

  connect(url, protocols, requestHeaders, onopen, onmessage, onclose, onerror) {
    return super.connect(
      url,
      protocols,
      normalizeHeaderPairs(requestHeaders),
      onopen,
      onmessage,
      onclose,
      onerror
    );
  }
}
