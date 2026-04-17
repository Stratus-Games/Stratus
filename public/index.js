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
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js"
  }
});

scramjet.init();

const connection = new BareMuxConnection("/baremux/worker.js");
const appConfig = window.__APP_CONFIG__ || {};

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
  if (current === "/libcurl/index.mjs") {
    return;
  }

  const defaultWispUrl = "wss://wisp.mercurywork.shop/";
  const wispUrl = appConfig.wispUrl || defaultWispUrl;

  await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.textContent = "";
  errorCode.textContent = "";

  try {
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
