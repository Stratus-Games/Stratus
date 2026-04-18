import { BareMuxConnection } from "/baremux/index.mjs";
import { $scramjetLoadController } from "/scram/scramjet.bundle.js";
import { registerSW } from "/register-sw.js";

const connection = new BareMuxConnection("/baremux/worker.js");
const appConfig = window.__APP_CONFIG__ || {};
const libcurlTransportPath = "/libcurl/transport-fixed.mjs?v=4";
const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
  prefix: "/service/scramjet/",
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js"
  }
});

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
    await scramjet.init();
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
