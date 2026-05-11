"use client";

import { useAtom } from "jotai";
import { apiUrlAtom, userIdAtom } from "../atoms/config";
import { SectionCard } from "./SectionCard";

export function GlobalConfigSection() {
  const [apiUrl, setApiUrl] = useAtom(apiUrlAtom);
  const [userId, setUserId] = useAtom(userIdAtom);

  return (
    <SectionCard title="Global Config">
      <label>
        API URL
        <input
          value={apiUrl}
          onChange={(event) => setApiUrl(event.target.value)}
          style={{ width: "100%" }}
        />
      </label>
      <label>
        user_id (UUID)
        <input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="Example: 11111111-1111-4111-8111-111111111111"
          style={{ width: "100%" }}
        />
      </label>
    </SectionCard>
  );
}
