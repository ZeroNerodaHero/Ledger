import { atom } from "jotai";

export type ApiCallResult = Record<string, unknown> | null;

export const loadingAtom = atom(false);
export const resultAtom = atom(null as ApiCallResult);
export const setLoadingAtom = atom(null, (_get, set, value: boolean) =>
  set(loadingAtom, value)
);
export const setResultAtom = atom(null, (_get, set, value: ApiCallResult) =>
  set(resultAtom, value)
);

export const lastGameIdAtom = atom("");
export const lastEventIdAtom = atom("");
export const lastActionIdAtom = atom("");
