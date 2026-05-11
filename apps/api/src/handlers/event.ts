import type { ServerResponse } from "node:http";
import type { Ctx } from "../types";
import { ok, fail } from "../lib/http";
import { ensureUser } from "../lib/db";
import { requireUserId } from "../lib/user";
import { isUuid, normalizeStake, normalizeTags } from "../lib/validation";

export async function handleEventCreate(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  if (!body.title || typeof body.title !== "string") {
    fail(res, 400, "title is required");
    return;
  }
  const gameId = (body.game_id as string | null | undefined) ?? null;
  if (gameId !== null && !isUuid(gameId)) {
    fail(res, 400, "game_id must be a UUID when provided");
    return;
  }
  const stake = normalizeStake(body.stake_usd);
  const tags = normalizeTags(body.tags_jsonb);
  await ensureUser(userId);

  if (gameId) {
    const gameRows = await sql`
      SELECT id
      FROM game
      WHERE id = ${gameId}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `;
    if (gameRows.length === 0) {
      fail(res, 404, "game_id not found for this user");
      return;
    }
  }

  const rows = await sql`
    INSERT INTO event (user_id, game_id, title, timestamp, stake_usd, note, tags_jsonb)
    VALUES (
      ${userId}::uuid,
      ${gameId},
      ${body.title.trim()},
      ${body.timestamp ?? new Date().toISOString()},
      ${stake ? sql.array(stake, "numeric") : null},
      ${body.note ?? null},
      ${sql.json(tags)}
    )
    RETURNING *
  `;
  ok(res, rows[0]);
}

export async function handleEventList(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  const gameId = (body.game_id as string | null | undefined) ?? null;
  let rows;
  if (gameId) {
    if (!isUuid(gameId)) {
      fail(res, 400, "game_id must be a UUID");
      return;
    }
    rows = await sql`
      SELECT *
      FROM event
      WHERE user_id = ${userId}::uuid AND game_id = ${gameId}::uuid
      ORDER BY timestamp DESC
    `;
  } else {
    rows = await sql`
      SELECT *
      FROM event
      WHERE user_id = ${userId}::uuid
      ORDER BY timestamp DESC
    `;
  }
  ok(res, rows);
}

export async function handleEventUpdate(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  if (!isUuid(body.event_id)) {
    fail(res, 400, "event_id must be a UUID");
    return;
  }
  const updates: any[] = [];
  if (body.title !== undefined) {
    updates.push(sql`title = ${String(body.title).trim()}`);
  }
  if (body.timestamp !== undefined) {
    updates.push(sql`timestamp = ${body.timestamp}`);
  }
  if (body.note !== undefined) {
    updates.push(sql`note = ${body.note}`);
  }
  if (body.stake_usd !== undefined) {
    const stake = normalizeStake(body.stake_usd);
    updates.push(
      sql`stake_usd = ${stake ? sql.array(stake, "numeric") : null}`
    );
  }
  if (body.tags_jsonb !== undefined) {
    const tags = normalizeTags(body.tags_jsonb);
    updates.push(sql`tags_jsonb = ${sql.json(tags)}`);
  }
  if (body.game_id !== undefined) {
    if (body.game_id === null || body.game_id === "") {
      updates.push(sql`game_id = ${null}`);
    } else {
      if (!isUuid(body.game_id)) {
        fail(res, 400, "game_id must be UUID or null");
        return;
      }
      const gameRows = await sql`
        SELECT id
        FROM game
        WHERE id = ${body.game_id}::uuid AND user_id = ${userId}::uuid
        LIMIT 1
      `;
      if (gameRows.length === 0) {
        fail(res, 404, "game_id not found for this user");
        return;
      }
      updates.push(sql`game_id = ${body.game_id}::uuid`);
    }
  }
  if (updates.length === 0) {
    fail(res, 400, "No fields to update");
    return;
  }
  const rows = await sql`
    UPDATE event
    SET ${sql(updates, sql`, `)}
    WHERE id = ${body.event_id}::uuid AND user_id = ${userId}::uuid
    RETURNING *
  `;
  if (rows.length === 0) {
    fail(res, 404, "Event not found");
    return;
  }
  ok(res, rows[0]);
}

export async function handleEventDelete(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  if (!isUuid(body.event_id)) {
    fail(res, 400, "event_id must be a UUID");
    return;
  }
  const rows = await sql`
    DELETE FROM event
    WHERE id = ${body.event_id}::uuid AND user_id = ${userId}::uuid
    RETURNING id
  `;
  if (rows.length === 0) {
    fail(res, 404, "Event not found");
    return;
  }
  ok(res, { deleted: true, event_id: body.event_id });
}
