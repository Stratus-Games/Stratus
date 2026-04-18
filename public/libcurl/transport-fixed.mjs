import LibcurlClient from "/libcurl/index.mjs?v=2.0.5";

function normalizeHeaderPairs(headers) {
  if (!headers) return [];

  if (headers instanceof Headers) {
    return Array.from(headers.entries());
  }

  if (Array.isArray(headers)) {
    return headers
      .filter((entry) => Array.isArray(entry) && entry.length >= 2)
      .map(([key, value]) => [String(key), String(value)]);
  }

  if (typeof headers[Symbol.iterator] === "function") {
    return Array.from(headers, ([key, value]) => [String(key), String(value)]);
  }

  if (typeof headers === "object") {
    return Object.entries(headers).map(([key, value]) => [String(key), String(value)]);
  }

  return [];
}

export default class SafeLibcurlClient extends LibcurlClient {
  async request(remote, method, body, headers, signal) {
    const response = await super.request(remote, method, body, normalizeHeaderPairs(headers), signal);

    return {
      ...response,
      headers: normalizeHeaderPairs(response.headers)
    };
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
