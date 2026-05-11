"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  actionAmountAtom,
  actionEventIdAtom,
  actionTypeAtom,
  deleteActionIdAtom,
  updateActionAmountAtom,
  updateActionIdAtom
} from "../atoms/forms";
import { lastActionIdAtom, lastEventIdAtom, loadingAtom } from "../atoms/ui";
import { SectionCard } from "./SectionCard";

type CallFn = (
  path: string,
  payload: Record<string, unknown>,
  afterSuccess?: (data: any) => void
) => Promise<void>;

type ActionSectionProps = {
  call: CallFn;
};

export function ActionSection({ call }: ActionSectionProps) {
  const [actionEventId, setActionEventId] = useAtom(actionEventIdAtom);
  const [actionType, setActionType] = useAtom(actionTypeAtom);
  const [actionAmount, setActionAmount] = useAtom(actionAmountAtom);
  const [updateActionId, setUpdateActionId] = useAtom(updateActionIdAtom);
  const [updateActionAmount, setUpdateActionAmount] = useAtom(updateActionAmountAtom);
  const [deleteActionId, setDeleteActionId] = useAtom(deleteActionIdAtom);
  const lastActionId = useAtomValue(lastActionIdAtom);
  const setLastActionId = useSetAtom(lastActionIdAtom);
  const lastEventId = useAtomValue(lastEventIdAtom);
  const loading = useAtomValue(loadingAtom);

  return (
    <SectionCard title="Action">
      <label>
        event_id
        <input
          value={actionEventId}
          onChange={(event) => setActionEventId(event.target.value)}
          placeholder={lastEventId || "required"}
          style={{ width: "100%" }}
        />
      </label>
      <label>
        action_type
        <select value={actionType} onChange={(event) => setActionType(event.target.value)} style={{ width: "100%" }}>
          <option value="buy_in">buy_in</option>
          <option value="cash_out">cash_out</option>
        </select>
      </label>
      <label>
        amount_usd
        <input value={actionAmount} onChange={(event) => setActionAmount(event.target.value)} style={{ width: "100%" }} />
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() =>
            call(
              "/api/v1/action/create",
              {
                event_id: actionEventId,
                action_type: actionType,
                amount_usd: Number(actionAmount)
              },
              (data) => setLastActionId(data.id)
            )
          }
          disabled={loading}
        >
          Create Action
        </button>
        <button
          onClick={() =>
            call("/api/v1/action/list", {
              event_id: actionEventId || undefined
            })
          }
          disabled={loading}
        >
          List Actions
        </button>
      </div>
      <label>
        update action_id
        <input
          value={updateActionId}
          onChange={(event) => setUpdateActionId(event.target.value)}
          placeholder={lastActionId || "required"}
          style={{ width: "100%" }}
        />
      </label>
      <label>
        update amount_usd
        <input value={updateActionAmount} onChange={(event) => setUpdateActionAmount(event.target.value)} style={{ width: "100%" }} />
      </label>
      <button
        onClick={() =>
          call("/api/v1/action/update", {
            action_id: updateActionId,
            amount_usd: Number(updateActionAmount)
          })
        }
        disabled={loading}
      >
        Update Action
      </button>
      <label>
        delete action_id
        <input
          value={deleteActionId}
          onChange={(event) => setDeleteActionId(event.target.value)}
          placeholder={lastActionId || "required"}
          style={{ width: "100%" }}
        />
      </label>
      <button onClick={() => call("/api/v1/action/delete", { action_id: deleteActionId })} disabled={loading}>
        Delete Action
      </button>
    </SectionCard>
  );
}
