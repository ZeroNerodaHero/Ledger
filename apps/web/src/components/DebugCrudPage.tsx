"use client";

import Link from "next/link";
import { useAtomValue, useSetAtom } from "jotai";
import { apiUrlAtom, userIdAtom } from "../atoms/config";
import { setLoadingAtom, setResultAtom } from "../atoms/ui";
import { endpointList } from "../constants/endpoints";
import { postJson } from "../lib/api/postJson";
import { GlobalConfigSection } from "./GlobalConfigSection";
import { GameSection } from "./GameSection";
import { EventSection } from "./EventSection";
import { ActionSection } from "./ActionSection";
import { EndpointsSection } from "./EndpointsSection";
import { ResponseSection } from "./ResponseSection";

export function DebugCrudPage() {
  const apiUrl = useAtomValue(apiUrlAtom);
  const userId = useAtomValue(userIdAtom);
  const setResult = useSetAtom(setResultAtom);
  const setLoading = useSetAtom(setLoadingAtom);

  async function call(
    path: string,
    payload: Record<string, unknown>,
    afterSuccess?: (data: any) => void
  ): Promise<void> {
    if (!userId) {
      setResult({
        status: 400,
        data: { ok: false, error: { message: "user_id is required" } }
      });
      return;
    }

    setLoading(true);
    try {
      const finalPayload = { user_id: userId, ...payload };
      const response = await postJson(apiUrl, path, finalPayload);
      setResult({ endpoint: path, payload: finalPayload, ...response });
      if (response.data?.ok && afterSuccess) {
        afterSuccess(response.data.data);
      }
    } catch (error) {
      setResult({
        endpoint: path,
        payload,
        status: 500,
        data: { ok: false, error: { message: (error as Error).message } }
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: "grid", gap: 16, maxWidth: 1000, padding: 16 }}>
      <h1>Ledger Debug Page</h1>
      <p>Raw POST endpoint tester for games, events, and actions.</p>
      <p style={{ margin: 0 }}>
        <Link href="/">Open mobile app</Link>
      </p>

      <GlobalConfigSection />
      <GameSection call={call} />
      <EventSection call={call} />
      <ActionSection call={call} />

      <EndpointsSection endpoints={endpointList} />
      <ResponseSection />
    </main>
  );
}
