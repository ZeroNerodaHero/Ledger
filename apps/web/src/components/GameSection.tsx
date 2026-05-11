"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  deleteGameIdAtom,
  gameNameAtom,
  updateGameIdAtom,
  updateGameNameAtom
} from "../atoms/forms";
import { lastGameIdAtom, loadingAtom } from "../atoms/ui";
import { SectionCard } from "./SectionCard";

type CallFn = (
  path: string,
  payload: Record<string, unknown>,
  afterSuccess?: (data: any) => void
) => Promise<void>;

type GameSectionProps = {
  call: CallFn;
};

export function GameSection({ call }: GameSectionProps) {
  const [gameName, setGameName] = useAtom(gameNameAtom);
  const [updateGameId, setUpdateGameId] = useAtom(updateGameIdAtom);
  const [updateGameName, setUpdateGameName] = useAtom(updateGameNameAtom);
  const [deleteGameId, setDeleteGameId] = useAtom(deleteGameIdAtom);
  const lastGameId = useAtomValue(lastGameIdAtom);
  const setLastGameId = useSetAtom(lastGameIdAtom);
  const loading = useAtomValue(loadingAtom);

  return (
    <SectionCard title="Game">
      <label>
        name
        <input value={gameName} onChange={(event) => setGameName(event.target.value)} style={{ width: "100%" }} />
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => call("/api/v1/game/create", { name: gameName }, (data) => setLastGameId(data.id))} disabled={loading}>
          Create Game
        </button>
        <button onClick={() => call("/api/v1/game/list", {})} disabled={loading}>
          List Games
        </button>
      </div>
      <label>
        update game_id
        <input
          value={updateGameId}
          onChange={(event) => setUpdateGameId(event.target.value)}
          placeholder={lastGameId || "required"}
          style={{ width: "100%" }}
        />
      </label>
      <label>
        update name
        <input value={updateGameName} onChange={(event) => setUpdateGameName(event.target.value)} style={{ width: "100%" }} />
      </label>
      <button onClick={() => call("/api/v1/game/update", { game_id: updateGameId, name: updateGameName })} disabled={loading}>
        Update Game
      </button>
      <label>
        delete game_id
        <input
          value={deleteGameId}
          onChange={(event) => setDeleteGameId(event.target.value)}
          placeholder={lastGameId || "required"}
          style={{ width: "100%" }}
        />
      </label>
      <button onClick={() => call("/api/v1/game/delete", { game_id: deleteGameId })} disabled={loading}>
        Delete Game
      </button>
    </SectionCard>
  );
}
