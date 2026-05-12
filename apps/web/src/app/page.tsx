"use client";

import Link from "next/link";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { apiUrlAtom, userIdAtom } from "../atoms/config";
import { postJson } from "../lib/api/postJson";

type JsonObject = Record<string, unknown>;

type Game = {
  id: string;
  name: string;
  location_note: string | null;
  tags_jsonb: JsonObject;
  created_at: string;
};

type EventItem = {
  id: string;
  game_id: string | null;
  title: string;
  timestamp: string;
  stake_usd: Array<string | number> | null;
  note: string | null;
  tags_jsonb: JsonObject;
};

type ActionItem = {
  id: string;
  event_id: string;
  action_type: "buy_in" | "cash_out";
  amount_usd: string | number;
  timestamp: string;
  note: string | null;
  tags_jsonb: JsonObject;
};

type PnlPoint = {
  label: string;
  pnl: number;
};

function parseTags(text: string): JsonObject | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const value = JSON.parse(trimmed) as unknown;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  throw new Error("tags must be a JSON object");
}

function matchesTag(filter: string, ...candidates: Array<JsonObject | null | undefined>): boolean {
  const normalized = filter.trim().toLowerCase();
  if (!normalized) return true;
  return candidates.some((candidate) => {
    if (!candidate) return false;
    return Object.entries(candidate).some(([key, value]) => {
      const keyMatch = key.toLowerCase().includes(normalized);
      const valueMatch = JSON.stringify(value).toLowerCase().includes(normalized);
      return keyMatch || valueMatch;
    });
  });
}

function toNumber(value: string | number): number {
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : 0;
}

function buildPnlPoints(actions: ActionItem[]): PnlPoint[] {
  let running = 0;
  return actions
    .slice()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((entry) => {
      const delta = entry.action_type === "cash_out" ? toNumber(entry.amount_usd) : -toNumber(entry.amount_usd);
      running += delta;
      return {
        label: new Date(entry.timestamp).toLocaleDateString(),
        pnl: Math.round(running * 100) / 100
      };
    });
}

function PnlChart({ points }: { points: PnlPoint[] }) {
  if (points.length === 0) {
    return <p style={{ margin: 0, color: "#666" }}>No action data yet.</p>;
  }

  const width = 320;
  const height = 150;
  const padding = 20;
  const values = points.map((point) => point.pnl);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / Math.max(points.length - 1, 1);
  const toY = (value: number) => height - padding - ((value - min) / range) * (height - padding * 2);
  const line = points
    .map((point, index) => `${padding + index * stepX},${toY(point.pnl)}`)
    .join(" ");
  const zeroY = toY(0);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ background: "#f8fafc", borderRadius: 8 }}>
        <line x1={padding} x2={width - padding} y1={zeroY} y2={zeroY} stroke="#94a3b8" strokeDasharray="3 3" />
        <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={line} />
      </svg>
      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#666" }}>
        Latest PnL: <strong>${points[points.length - 1].pnl.toFixed(2)}</strong>
      </p>
    </div>
  );
}

export default function MobileLedgerPage() {
  const [apiUrl, setApiUrl] = useAtom(apiUrlAtom);
  const [userId, setUserId] = useAtom(userIdAtom);

  const [games, setGames] = useState<Game[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);

  const [selectedGameId, setSelectedGameId] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);

  const [newGameName, setNewGameName] = useState("");
  const [newGameTags, setNewGameTags] = useState('{"type":"cash"}');
  const [editGameId, setEditGameId] = useState("");
  const [editGameName, setEditGameName] = useState("");

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventGameId, setNewEventGameId] = useState("");
  const [newEventNote, setNewEventNote] = useState("");
  const [newEventTags, setNewEventTags] = useState('{"session":"night"}');
  const [editEventId, setEditEventId] = useState("");
  const [editEventTitle, setEditEventTitle] = useState("");

  const [newActionEventId, setNewActionEventId] = useState("");
  const [newActionType, setNewActionType] = useState<"buy_in" | "cash_out">("buy_in");
  const [newActionAmount, setNewActionAmount] = useState("100");
  const [newActionTags, setNewActionTags] = useState('{"entry":"manual"}');
  const [editActionId, setEditActionId] = useState("");
  const [editActionAmount, setEditActionAmount] = useState("");
  const [editActionType, setEditActionType] = useState<"buy_in" | "cash_out">("buy_in");

  async function request<T>(path: string, payload: Record<string, unknown>): Promise<T> {
    if (!userId.trim()) {
      throw new Error("user_id is required");
    }
    const response = await postJson(apiUrl, path, { user_id: userId, ...payload });
    if (!response.data?.ok) {
      throw new Error(response.data?.error?.message || `request failed (${response.status})`);
    }
    return response.data.data as T;
  }

  async function run(label: string, work: () => Promise<void>): Promise<void> {
    setBusy(true);
    setStatus(`${label}...`);
    try {
      await work();
      setStatus(`${label} complete`);
    } catch (error) {
      setStatus(`Error: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function refreshAll(): Promise<void> {
    const [gamesData, eventsData, actionsData] = await Promise.all([
      request<Game[]>("/api/v1/game/list", {}),
      request<EventItem[]>("/api/v1/event/list", {}),
      request<ActionItem[]>("/api/v1/action/list", {})
    ]);
    setGames(gamesData);
    setEvents(eventsData);
    setActions(actionsData);
  }

  useEffect(() => {
    if (!userId.trim()) return;
    void run("Refreshing", refreshAll);
  }, [userId]);

  const eventById = useMemo(() => new Map(events.map((entry) => [entry.id, entry])), [events]);
  const gameById = useMemo(() => new Map(games.map((entry) => [entry.id, entry])), [games]);

  const filteredEvents = useMemo(
    () =>
      events.filter((entry) => {
        if (selectedGameId && entry.game_id !== selectedGameId) return false;
        const game = entry.game_id ? gameById.get(entry.game_id) : undefined;
        return matchesTag(tagFilter, entry.tags_jsonb, game?.tags_jsonb);
      }),
    [events, selectedGameId, tagFilter, gameById]
  );

  const filteredActions = useMemo(
    () =>
      actions.filter((entry) => {
        const event = eventById.get(entry.event_id);
        const game = event?.game_id ? gameById.get(event.game_id) : undefined;
        if (selectedGameId && event?.game_id !== selectedGameId) return false;
        return matchesTag(tagFilter, entry.tags_jsonb, event?.tags_jsonb, game?.tags_jsonb);
      }),
    [actions, selectedGameId, tagFilter, eventById, gameById]
  );

  const pnlPoints = useMemo(() => buildPnlPoints(filteredActions), [filteredActions]);

  return (
    <main style={{ maxWidth: 540, margin: "0 auto", padding: 12, display: "grid", gap: 12 }}>
      <h1 style={{ margin: "8px 0 0" }}>Ledger Mobile SPA</h1>
      <p style={{ margin: 0, color: "#4b5563" }}>Add, modify, fetch data, and track PnL over time.</p>
      <p style={{ margin: 0 }}>
        <Link href="/debug">Open debug page</Link>
      </p>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <strong>Config</strong>
        <input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} placeholder="API URL" />
        <input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="user_id UUID"
        />
        <button onClick={() => run("Refreshing", refreshAll)} disabled={busy}>
          Refresh Data
        </button>
        <small>{status}</small>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <strong>Filters</strong>
        <select value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)}>
          <option value="">All games</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
        <input
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
          placeholder="Filter by tag key/value"
        />
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <strong>PnL over time</strong>
        <PnlChart points={pnlPoints} />
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <strong>Game CRUD</strong>
        <input value={newGameName} onChange={(event) => setNewGameName(event.target.value)} placeholder="New game name" />
        <textarea value={newGameTags} onChange={(event) => setNewGameTags(event.target.value)} rows={2} />
        <button
          disabled={busy}
          onClick={() =>
            run("Creating game", async () => {
              await request("/api/v1/game/create", { name: newGameName, tags_jsonb: parseTags(newGameTags) });
              await refreshAll();
            })
          }
        >
          Add Game
        </button>

        <select value={editGameId} onChange={(event) => setEditGameId(event.target.value)}>
          <option value="">Select game to edit/delete</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
        <input value={editGameName} onChange={(event) => setEditGameName(event.target.value)} placeholder="New game name" />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={busy || !editGameId}
            onClick={() =>
              run("Updating game", async () => {
                await request("/api/v1/game/update", { game_id: editGameId, name: editGameName });
                await refreshAll();
              })
            }
          >
            Update
          </button>
          <button
            disabled={busy || !editGameId}
            onClick={() =>
              run("Deleting game", async () => {
                await request("/api/v1/game/delete", { game_id: editGameId });
                await refreshAll();
              })
            }
          >
            Delete
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <strong>Event CRUD</strong>
        <input value={newEventTitle} onChange={(event) => setNewEventTitle(event.target.value)} placeholder="Event title" />
        <select value={newEventGameId} onChange={(event) => setNewEventGameId(event.target.value)}>
          <option value="">No game</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
        <input value={newEventNote} onChange={(event) => setNewEventNote(event.target.value)} placeholder="Event note" />
        <textarea value={newEventTags} onChange={(event) => setNewEventTags(event.target.value)} rows={2} />
        <button
          disabled={busy}
          onClick={() =>
            run("Creating event", async () => {
              await request("/api/v1/event/create", {
                title: newEventTitle,
                game_id: newEventGameId || null,
                note: newEventNote || null,
                tags_jsonb: parseTags(newEventTags)
              });
              await refreshAll();
            })
          }
        >
          Add Event
        </button>

        <select value={editEventId} onChange={(event) => setEditEventId(event.target.value)}>
          <option value="">Select event to edit/delete</option>
          {filteredEvents.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
        <input value={editEventTitle} onChange={(event) => setEditEventTitle(event.target.value)} placeholder="New event title" />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={busy || !editEventId}
            onClick={() =>
              run("Updating event", async () => {
                await request("/api/v1/event/update", { event_id: editEventId, title: editEventTitle });
                await refreshAll();
              })
            }
          >
            Update
          </button>
          <button
            disabled={busy || !editEventId}
            onClick={() =>
              run("Deleting event", async () => {
                await request("/api/v1/event/delete", { event_id: editEventId });
                await refreshAll();
              })
            }
          >
            Delete
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <strong>Action CRUD</strong>
        <select value={newActionEventId} onChange={(event) => setNewActionEventId(event.target.value)}>
          <option value="">Select event</option>
          {filteredEvents.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
        <select value={newActionType} onChange={(event) => setNewActionType(event.target.value as "buy_in" | "cash_out")}>
          <option value="buy_in">buy_in</option>
          <option value="cash_out">cash_out</option>
        </select>
        <input value={newActionAmount} onChange={(event) => setNewActionAmount(event.target.value)} placeholder="Amount USD" />
        <textarea value={newActionTags} onChange={(event) => setNewActionTags(event.target.value)} rows={2} />
        <button
          disabled={busy}
          onClick={() =>
            run("Creating action", async () => {
              await request("/api/v1/action/create", {
                event_id: newActionEventId,
                action_type: newActionType,
                amount_usd: Number(newActionAmount),
                tags_jsonb: parseTags(newActionTags)
              });
              await refreshAll();
            })
          }
        >
          Add Action
        </button>

        <select value={editActionId} onChange={(event) => setEditActionId(event.target.value)}>
          <option value="">Select action to edit/delete</option>
          {filteredActions.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.action_type} ${toNumber(entry.amount_usd).toFixed(2)}
            </option>
          ))}
        </select>
        <select value={editActionType} onChange={(event) => setEditActionType(event.target.value as "buy_in" | "cash_out")}>
          <option value="buy_in">buy_in</option>
          <option value="cash_out">cash_out</option>
        </select>
        <input
          value={editActionAmount}
          onChange={(event) => setEditActionAmount(event.target.value)}
          placeholder="New amount USD"
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={busy || !editActionId}
            onClick={() =>
              run("Updating action", async () => {
                await request("/api/v1/action/update", {
                  action_id: editActionId,
                  action_type: editActionType,
                  amount_usd: Number(editActionAmount)
                });
                await refreshAll();
              })
            }
          >
            Update
          </button>
          <button
            disabled={busy || !editActionId}
            onClick={() =>
              run("Deleting action", async () => {
                await request("/api/v1/action/delete", { action_id: editActionId });
                await refreshAll();
              })
            }
          >
            Delete
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <strong>Quick Data View</strong>
        <small>Games: {games.length}</small>
        <small>Events (filtered): {filteredEvents.length}</small>
        <small>Actions (filtered): {filteredActions.length}</small>
      </section>
    </main>
  );
}
