"use client";

import { useAtomValue } from "jotai";
import {
  lastActionIdAtom,
  lastEventIdAtom,
  lastGameIdAtom,
  resultAtom
} from "../atoms/ui";
import { SectionCard } from "./SectionCard";

export function ResponseSection() {
  const result = useAtomValue(resultAtom);
  const lastGameId = useAtomValue(lastGameIdAtom);
  const lastEventId = useAtomValue(lastEventIdAtom);
  const lastActionId = useAtomValue(lastActionIdAtom);

  return (
    <SectionCard title="Latest Response">
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
        {JSON.stringify(result, null, 2)}
      </pre>
      <p style={{ margin: 0 }}>
        Last IDs: game=<code>{lastGameId || "-"}</code> event=<code>{lastEventId || "-"}</code> action=
        <code>{lastActionId || "-"}</code>
      </p>
    </SectionCard>
  );
}
