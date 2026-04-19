import { BareMuxConnection } from "/baremux/index.mjs";
import { $scramjetLoadController } from "/scram/scramjet.bundle.js";
import { registerSW } from "/register-sw.js";

const connection = new BareMuxConnection("/baremux/worker.js");
const appConfig = window.__APP_CONFIG__ || {};
const libcurlTransportPath = "/libcurl/transport-fixed.mjs?v=5";
const bareTransportPath = "/bare-transport/transport-fixed.mjs?v=2";
const preferBareTransport = appConfig.preferBareTransport !== false;
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

function shouldUseBareTransport(targetUrl) {
  if (!targetUrl) return false;

  try {
    const host = new URL(targetUrl).hostname.toLowerCase();
    return host === "play.geforcenow.com" || host.endsWith(".nvidia.com");
  } catch {
    return false;
  }
}

async function ensureTransport(targetUrl) {
  const useBare = preferBareTransport || shouldUseBareTransport(targetUrl);
  const selectedTransportPath = useBare ? bareTransportPath : libcurlTransportPath;
  const current = await connection.getTransport();
  if (current === selectedTransportPath) return;

  if (useBare) {
    const bareUrl = `${location.origin}/bare/`;
    await connection.setTransport(bareTransportPath, [bareUrl]);
    return;
  }

  const defaultWispUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`;
  const wispUrl = appConfig.wispUrl || defaultWispUrl;
  await connection.setTransport(libcurlTransportPath, [{ websocket: wispUrl }]);
}

export async function ensureScramjetReady(targetUrl) {
  if (!readyPromise) {
    readyPromise = (async () => {
      await scramjet.init();
      await registerSW();
    })();
  }

  try {
    await readyPromise;
    await ensureTransport(targetUrl);
  } catch (err) {
    readyPromise = null;
    throw err;
  }

  return readyPromise;
}
