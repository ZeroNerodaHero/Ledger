import type { ServerResponse } from "node:http";
import type { Ctx } from "../types";
import { ok, fail } from "../lib/http";
import { requireUserId } from "../lib/user";
import { isUuid, normalizeTags } from "../lib/validation";

export async function handleActionCreate(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  if (!isUuid(body.event_id)) {
    fail(res, 400, "event_id is required and must be a UUID");
    return;
  }
  if (!["buy_in", "cash_out"].includes(String(body.action_type))) {
    fail(res, 400, "action_type must be buy_in or cash_out");
    return;
  }
  const amount = Number(body.amount_usd);
  if (!Number.isFinite(amount) || amount <= 0) {
    fail(res, 400, "amount_usd must be a positive number");
    return;
  }
  const tags = normalizeTags(body.tags_jsonb);
  const rows = await sql`
    INSERT INTO action (user_id, event_id, action_type, amount_usd, timestamp, note, tags_jsonb)
    SELECT
      ${userId}::uuid,
      e.id,
      ${String(body.action_type)},
      ${amount},
      ${body.timestamp ?? new Date().toISOString()},
      ${body.note ?? null},
      ${sql.json(tags)}
    FROM event e
    WHERE e.id = ${body.event_id}::uuid AND e.user_id = ${userId}::uuid
    RETURNING *
  `;
  if (rows.length === 0) {
    fail(res, 404, "event_id not found for this user");
    return;
  }
  ok(res, rows[0]);
}

export async function handleActionList(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  let rows;
  if (body.event_id) {
    if (!isUuid(body.event_id)) {
      fail(res, 400, "event_id must be a UUID");
      return;
    }
    rows = await sql`
      SELECT a.*
      FROM action a
      JOIN event e ON e.id = a.event_id
      WHERE a.user_id = ${userId}::uuid
        AND a.event_id = ${body.event_id}::uuid
        AND e.user_id = ${userId}::uuid
      ORDER BY a.timestamp DESC
    `;
  } else {
    rows = await sql`
      SELECT *
      FROM action
      WHERE user_id = ${userId}::uuid
      ORDER BY timestamp DESC
    `;
  }
  ok(res, rows);
}

export async function handleActionUpdate(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  if (!isUuid(body.action_id)) {
    fail(res, 400, "action_id must be a UUID");
    return;
  }
  const updates: any[] = [];
  if (body.action_type !== undefined) {
    if (!["buy_in", "cash_out"].includes(String(body.action_type))) {
      fail(res, 400, "action_type must be buy_in or cash_out");
      return;
    }
    updates.push(sql`action_type = ${String(body.action_type)}`);
  }
  if (body.amount_usd !== undefined) {
    const amount = Number(body.amount_usd);
    if (!Number.isFinite(amount) || amount <= 0) {
      fail(res, 400, "amount_usd must be a positive number");
      return;
    }
    updates.push(sql`amount_usd = ${amount}`);
  }
  if (body.timestamp !== undefined) {
    updates.push(sql`timestamp = ${body.timestamp}`);
  }
  if (body.note !== undefined) {
    updates.push(sql`note = ${body.note}`);
  }
  if (body.tags_jsonb !== undefined) {
    const tags = normalizeTags(body.tags_jsonb);
    updates.push(sql`tags_jsonb = ${sql.json(tags)}`);
  }
  if (body.event_id !== undefined) {
    if (!isUuid(body.event_id)) {
      fail(res, 400, "event_id must be a UUID");
      return;
    }
    const eventRows = await sql`
      SELECT id
      FROM event
      WHERE id = ${body.event_id}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `;
    if (eventRows.length === 0) {
      fail(res, 404, "event_id not found for this user");
      return;
    }
    updates.push(sql`event_id = ${body.event_id}::uuid`);
  }
  if (updates.length === 0) {
    fail(res, 400, "No fields to update");
    return;
  }
  const rows = await sql`
    UPDATE action
    SET ${sql(updates, sql`, `)}
    WHERE id = ${body.action_id}::uuid AND user_id = ${userId}::uuid
    RETURNING *
  `;
  if (rows.length === 0) {
    fail(res, 404, "Action not found");
    return;
  }
  ok(res, rows[0]);
}

export async function handleActionDelete(
  ctx: Ctx,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const { sql } = ctx;
  const userId = requireUserId(res, body);
  if (!userId) return;
  if (!isUuid(body.action_id)) {
    fail(res, 400, "action_id must be a UUID");
    return;
  }
  const rows = await sql`
    DELETE FROM action
    WHERE id = ${body.action_id}::uuid AND user_id = ${userId}::uuid
    RETURNING id
  `;
  if (rows.length === 0) {
    fail(res, 404, "Action not found");
    return;
  }
  ok(res, { deleted: true, action_id: body.action_id });
}
