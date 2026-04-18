import { BareMuxConnection } from "/baremux/index.mjs";
import { $scramjetLoadController } from "/scram/scramjet.bundle.js";
import { registerSW } from "/register-sw.js";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");
const frameContainer = document.getElementById("frame-container");

const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
  prefix: "/service/scramjet/",
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js"
  }
});

const scramjetReady = scramjet.init();

const connection = new BareMuxConnection("/baremux/worker.js");
const appConfig = window.__APP_CONFIG__ || {};
const libcurlTransportPath = "/libcurl/transport-fixed.mjs?v=4";

function normalizeInput(value) {
  const input = value.trim();
  if (!input) {
    return "https://example.com";
  }

  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(input)) {
    return `https://${input}`;
  }

  return `https://duckduckgo.com/?q=${encodeURIComponent(input)}`;
}

async function ensureTransport() {
  const current = await connection.getTransport();
  if (current === libcurlTransportPath) {
    return;
  }

  const defaultWispUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`;
  const wispUrl = appConfig.wispUrl || defaultWispUrl;

  await connection.setTransport(libcurlTransportPath, [{ websocket: wispUrl }]);
}

if (!form || !address || !error || !errorCode || !frameContainer) {
  console.warn("[index.js] Scramjet form UI not found on this page; skipping form bindings.");
} else form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.textContent = "";
  errorCode.textContent = "";

  try {
    await scramjetReady;
    await registerSW();
    await ensureTransport();

    frameContainer.textContent = "";
    const frame = scramjet.createFrame();
    frame.frame.id = "sj-frame";
    frameContainer.appendChild(frame.frame);
    frame.go(normalizeInput(address.value));
  } catch (err) {
    error.textContent = "Failed to open URL in Scramjet.";
    errorCode.textContent = String(err);
  }
});
