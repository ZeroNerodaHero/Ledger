import type { IncomingMessage, ServerResponse } from "node:http";

export function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: unknown
): void {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  });
  res.end(JSON.stringify(payload));
}

export function ok(res: ServerResponse, data: unknown): void {
  sendJson(res, 200, { ok: true, data, error: null });
}

export function fail(
  res: ServerResponse,
  statusCode: number,
  message: string,
  details: unknown = null
): void {
  sendJson(res, statusCode, {
    ok: false,
    data: null,
    error: { message, details }
  });
}

export async function readBody(
  req: IncomingMessage
): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}
