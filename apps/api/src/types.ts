import type { ServerResponse } from "node:http";

export type Ctx = {
  sql: any;
};

export type Handler = (
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
) => Promise<void>;
