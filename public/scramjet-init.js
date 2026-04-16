import { BareMuxConnection } from "/baremux/index.mjs";
import { registerSW } from "/register-sw.js";

const connection = new BareMuxConnection("/baremux/worker.js");
const appConfig = window.__APP_CONFIG__ || {};
const libcurlTransportPath = "/libcurl/index.mjs?v=2.0.5";

let readyPromise = null;

async function ensureTransport() {
  const current = await connection.getTransport();
  if (current === libcurlTransportPath) return;

  const defaultWispUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`;
  const wispUrl = appConfig.wispUrl || defaultWispUrl;
  await connection.setTransport(libcurlTransportPath, [{ websocket: wispUrl }]);
}

export async function ensureScramjetReady() {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    await registerSW();
    await ensureTransport();
  })();

  try {
    await readyPromise;
  } catch (err) {
    readyPromise = null;
    throw err;
  }

  return readyPromise;
}
