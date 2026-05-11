"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  deleteEventIdAtom,
  eventGameIdAtom,
  eventStakeAtom,
  eventTitleAtom,
  updateEventIdAtom,
  updateEventTitleAtom
} from "../atoms/forms";
import { lastEventIdAtom, lastGameIdAtom, loadingAtom } from "../atoms/ui";
import { SectionCard } from "./SectionCard";

type CallFn = (
  path: string,
  payload: Record<string, unknown>,
  afterSuccess?: (data: any) => void
) => Promise<void>;

type EventSectionProps = {
  call: CallFn;
};

export function EventSection({ call }: EventSectionProps) {
  const [eventTitle, setEventTitle] = useAtom(eventTitleAtom);
  const [eventGameId, setEventGameId] = useAtom(eventGameIdAtom);
  const [eventStake, setEventStake] = useAtom(eventStakeAtom);
  const [updateEventId, setUpdateEventId] = useAtom(updateEventIdAtom);
  const [updateEventTitle, setUpdateEventTitle] = useAtom(updateEventTitleAtom);
  const [deleteEventId, setDeleteEventId] = useAtom(deleteEventIdAtom);
  const lastEventId = useAtomValue(lastEventIdAtom);
  const setLastEventId = useSetAtom(lastEventIdAtom);
  const lastGameId = useAtomValue(lastGameIdAtom);
  const loading = useAtomValue(loadingAtom);

  return (
    <SectionCard title="Event">
      <label>
        title
        <input value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} style={{ width: "100%" }} />
      </label>
      <label>
        game_id (optional)
        <input
          value={eventGameId}
          onChange={(event) => setEventGameId(event.target.value)}
          placeholder={lastGameId || "optional"}
          style={{ width: "100%" }}
        />
      </label>
      <label>
        stake_usd JSON array (optional)
        <input
          value={eventStake}
          onChange={(event) => setEventStake(event.target.value)}
          placeholder="[1,2]"
          style={{ width: "100%" }}
        />
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() =>
            call(
              "/api/v1/event/create",
              {
                title: eventTitle,
                game_id: eventGameId || null,
                stake_usd: eventStake || null
              },
              (data) => setLastEventId(data.id)
            )
          }
          disabled={loading}
        >
          Create Event
        </button>
        <button
          onClick={() =>
            call("/api/v1/event/list", {
              game_id: eventGameId || undefined
            })
          }
          disabled={loading}
        >
          List Events
        </button>
      </div>
      <label>
        update event_id
        <input
          value={updateEventId}
          onChange={(event) => setUpdateEventId(event.target.value)}
          placeholder={lastEventId || "required"}
          style={{ width: "100%" }}
        />
      </label>
      <label>
        update title
        <input value={updateEventTitle} onChange={(event) => setUpdateEventTitle(event.target.value)} style={{ width: "100%" }} />
      </label>
      <button onClick={() => call("/api/v1/event/update", { event_id: updateEventId, title: updateEventTitle })} disabled={loading}>
        Update Event
      </button>
      <label>
        delete event_id
        <input
          value={deleteEventId}
          onChange={(event) => setDeleteEventId(event.target.value)}
          placeholder={lastEventId || "required"}
          style={{ width: "100%" }}
        />
      </label>
      <button onClick={() => call("/api/v1/event/delete", { event_id: deleteEventId })} disabled={loading}>
        Delete Event
      </button>
    </SectionCard>
  );
}
