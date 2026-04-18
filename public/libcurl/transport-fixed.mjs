import LibcurlClient from "/libcurl/index.mjs?v=2.0.5";

function normalizeHeaderPairs(headers) {
  if (!headers) return [];

  if (headers instanceof Headers) {
    return headers;
  }

  if (typeof headers[Symbol.iterator] === "function") {
    return headers;
  }

  if (typeof headers === "object") {
    return Object.entries(headers);
  }

  return [];
}

function normalizeResponseHeaders(headers) {
  const pairs = normalizeHeaderPairs(headers);
  const output = {};

  for (const entry of pairs) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const key = String(entry[0]).toLowerCase();
    const value = String(entry[1]);

    if (Object.prototype.hasOwnProperty.call(output, key)) {
      output[key] = `${output[key]}, ${value}`;
    } else {
      output[key] = value;
    }
  }

  return output;
}

export default class SafeLibcurlClient extends LibcurlClient {
  async request(remote, method, body, headers, signal) {
    const response = await super.request(remote, method, body, normalizeHeaderPairs(headers), signal);
    return {
      ...response,
      headers: normalizeResponseHeaders(response.headers)
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
