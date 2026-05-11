import type { ServerResponse } from "node:http";
import type { Ctx } from "../types";
import { ok, fail } from "../lib/http";
import { ensureUser } from "../lib/db";
import { requireUserId } from "../lib/user";
import { isUuid, normalizeTags } from "../lib/validation";

export async function handleGameCreate(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  if (!body.name || typeof body.name !== "string") {
    fail(res, 400, "name is required");
    return;
  }
  await ensureUser(userId);
  const tags = normalizeTags(body.tags_jsonb);
  const rows = await sql`
    INSERT INTO game (user_id, name, location_note, tags_jsonb)
    VALUES (
      ${userId}::uuid,
      ${body.name.trim()},
      ${body.location_note ?? null},
      ${sql.json(tags)}
    )
    RETURNING *
  `;
  ok(res, rows[0]);
}

export async function handleGameList(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  const rows = await sql`
    SELECT *
    FROM game
    WHERE user_id = ${userId}::uuid
    ORDER BY created_at DESC
  `;
  ok(res, rows);
}

export async function handleGameUpdate(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  if (!isUuid(body.game_id)) {
    fail(res, 400, "game_id must be a UUID");
    return;
  }
  const updates: any[] = [];
  if (body.name !== undefined) {
    updates.push(sql`name = ${String(body.name).trim()}`);
  }
  if (body.location_note !== undefined) {
    updates.push(sql`location_note = ${body.location_note}`);
  }
  if (body.tags_jsonb !== undefined) {
    const tags = normalizeTags(body.tags_jsonb);
    updates.push(sql`tags_jsonb = ${sql.json(tags)}`);
  }
  if (updates.length === 0) {
    fail(res, 400, "No fields to update");
    return;
  }
  const rows = await sql`
    UPDATE game
    SET ${sql(updates, sql`, `)}
    WHERE id = ${body.game_id}::uuid AND user_id = ${userId}::uuid
    RETURNING *
  `;
  if (rows.length === 0) {
    fail(res, 404, "Game not found");
    return;
  }
  ok(res, rows[0]);
}

export async function handleGameDelete(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  if (!isUuid(body.game_id)) {
    fail(res, 400, "game_id must be a UUID");
    return;
  }
  const rows = await sql`
    DELETE FROM game
    WHERE id = ${body.game_id}::uuid AND user_id = ${userId}::uuid
    RETURNING id
  `;
  if (rows.length === 0) {
    fail(res, 404, "Game not found");
    return;
  }
  ok(res, { deleted: true, game_id: body.game_id });
}
