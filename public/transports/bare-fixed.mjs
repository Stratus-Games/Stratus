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

function wantsHtml(headers) {
  const accept = String(headers.accept || "");
  return accept.includes("text/html");
}

function coerceDocumentContentType(requestHeaders, responseHeaders) {
  if (!wantsHtml(requestHeaders)) return responseHeaders;

  const contentType = String(responseHeaders["content-type"] || "").toLowerCase();
  if (contentType.length === 0 || contentType.startsWith("text/plain")) {
    return {
      ...responseHeaders,
      "content-type": "text/html; charset=utf-8"
    };
  }

  return responseHeaders;
}

export default class SafeBareClient extends BareClient {
  async request(remote, method, body, headers, signal) {
    const normalizedRequestPairs = normalizeHeaderPairs(headers);
    const normalizedRequestHeaders = Object.fromEntries(normalizedRequestPairs);
    const response = await super.request(remote, method, body, normalizedRequestPairs, signal);
    const normalizedResponseHeaders = normalizeResponseHeaders(response.headers);

    return {
      ...response,
      headers: coerceDocumentContentType(normalizedRequestHeaders, normalizedResponseHeaders)
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
