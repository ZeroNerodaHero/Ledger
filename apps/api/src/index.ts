import "dotenv/config";
import http from "node:http";
import pino from "pino";
import { routes } from "./routes";
import { readBody, ok, fail, sendJson } from "./lib/http";
import { sql } from "./lib/db";
import type { Ctx } from "./types";

const logger = pino({ name: "ledger-api" });
const port = Number(process.env.PORT || 4000);

const ctx: Ctx = { sql };

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.url === "/healthz") {
    ok(res, { service: "api", status: "healthy" });
    return;
  }

  if (req.method !== "POST") {
    fail(res, 405, "Only POST is supported");
    return;
  }

  const route = routes[req.url || ""];
  if (!route) {
    fail(res, 404, "Route not found");
    return;
  }

  try {
    const body = await readBody(req);
    await route(ctx, res, body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      fail(res, 400, "Invalid JSON body");
      return;
    }
    logger.error({ error }, "Request failed");
    fail(res, 500, "Server error", (error as Error).message);
  }
});

server.listen(port, () => {
  logger.info({ port }, "API server started");
});

process.on("SIGTERM", async () => {
  await sql.end({ timeout: 5 });
  process.exit(0);
});
