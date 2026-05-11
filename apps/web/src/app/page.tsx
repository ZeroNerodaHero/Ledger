"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { apiUrlAtom, userIdAtom } from "../atoms/config";
import { loadingAtom, resultAtom } from "../atoms/ui";
import { endpointList } from "../constants/endpoints";
import { postJson } from "../lib/api/postJson";
import { GlobalConfigSection } from "../components/GlobalConfigSection";
import { GameSection } from "../components/GameSection";
import { EventSection } from "../components/EventSection";
import { ActionSection } from "../components/ActionSection";
import { EndpointsSection } from "../components/EndpointsSection";
import { ResponseSection } from "../components/ResponseSection";

export default function HomePage() {
  const apiUrl = useAtomValue(apiUrlAtom);
  const userId = useAtomValue(userIdAtom);
  const setResult = useSetAtom(resultAtom);
  const setLoading = useSetAtom(loadingAtom);

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
    <main style={{ display: "grid", gap: 16, maxWidth: 1000 }}>
      <h1>Ledger CRUD Tester</h1>
      <p>POST-only endpoints for games, events, and actions.</p>

      <GlobalConfigSection />
      <GameSection call={call} />
      <EventSection call={call} />
      <ActionSection call={call} />

      <EndpointsSection endpoints={endpointList} />
      <ResponseSection />
    </main>
  );
}
