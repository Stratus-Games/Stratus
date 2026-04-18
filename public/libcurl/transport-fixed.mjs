import LibcurlClient from "/libcurl/index.mjs?v=2.0.5";

function normalizeHeaderPairs(headers) {
  if (!headers) return [];

  if (typeof headers[Symbol.iterator] === "function") {
    return headers;
  }

  if (typeof headers === "object") {
    return Object.entries(headers);
  }

  return [];
}

export default class SafeLibcurlClient extends LibcurlClient {
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
