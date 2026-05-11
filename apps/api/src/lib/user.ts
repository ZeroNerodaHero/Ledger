import type { ServerResponse } from "node:http";
import { fail } from "./http";
import { isUuid } from "./validation";

export function requireUserId(
  res: ServerResponse,
  body: Record<string, unknown>
): string | null {
  if (!isUuid(body.user_id)) {
    fail(res, 400, "user_id is required and must be a UUID");
    return null;
  }
  return body.user_id;
}
