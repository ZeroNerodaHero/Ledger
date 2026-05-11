import "dotenv/config";
import http from "node:http";
import pino from "pino";

const logger = pino({ name: "ledger-realtime-cron-mock" });
const port = Number(process.env.PORT || 4100);

const server = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "realtime-cron" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(port, () => {
  logger.info({ port }, "Realtime cron is idle (no jobs enabled)");
});
