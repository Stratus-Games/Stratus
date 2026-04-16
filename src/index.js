import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import fs from "fs";

// Paths
const publicPath = fileURLToPath(new URL("../public/", import.meta.url));
const libcurlPath = fileURLToPath(new URL("../public/libcurl/", import.meta.url));

// Logging
logging.set_level(logging.NONE);

// Wisp options
Object.assign(wisp.options, {
  allow_udp_streams: false,
  hostname_blacklist: [/example\.com/],
  dns_servers: ["1.1.1.1", "1.0.0.1"]
});

// Cross-Origin Isolation
const useCrossOriginIsolation = process.env.CROSS_ORIGIN_ISOLATION === "true";

// Fastify server
const app = Fastify({
  serverFactory: (handler) => {
    const server = createServer()
      .on("request", (req, res) => {
        if (useCrossOriginIsolation) {
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        } else {
          res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
          res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
        }
        handler(req, res);
      })
      .on("upgrade", (req, socket, head) => {
        if (!req.url) {
          socket.destroy();
          return;
        }
        if (req.url.endsWith("/wisp/")) {
          try {
            wisp.routeRequest(req, socket, head);
          } catch (err) {
            console.error("Wisp upgrade error:", err);
            socket.destroy();
          }
          return;
        }
        socket.end();
      });
    return server;
  }
});

// Verify static paths exist
[publicPath, scramjetPath, libcurlPath, baremuxPath].forEach((path) => {
  if (!fs.existsSync(path)) {
    console.warn(`Warning: Path does not exist -> ${path}`);
  }
});

// Register static routes
app.register(fastifyStatic, { root: publicPath, decorateReply: true });
app.register(fastifyStatic, { root: scramjetPath, prefix: "/scramjet/", decorateReply: false });
app.register(fastifyStatic, { root: libcurlPath, prefix: "/libcurl/", decorateReply: false });
app.register(fastifyStatic, { root: baremuxPath, prefix: "/baremux/", decorateReply: false });

// 404 handler
app.setNotFoundHandler((req, reply) => {
  reply.code(404).type("text/html").sendFile("404.html");
});

// Listening event
app.server.on("listening", () => {
  const address = app.server.address();
  console.log("Server listening on:");
  console.log(`  http://localhost:${address.port}`);
});

// Port and host
const port = Number.parseInt(process.env.PORT ?? "9000", 10) || 9000;
const host = process.env.HOST ?? "127.0.0.1";

// Recursive startup for EADDRINUSE
async function startServer(preferredPort) {
  try {
    await app.listen({ port: preferredPort, host });
  } catch (err) {
    if (err?.code === "EADDRINUSE") {
      console.warn(`Port ${preferredPort} in use, trying ${preferredPort + 1}...`);
      await startServer(preferredPort + 1);
      return;
    }
    console.error("Server failed to start:", err);
    process.exit(1);
  }
}

// Start server
(async () => {
  await startServer(port);
})();
