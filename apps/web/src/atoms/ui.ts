import { atom } from "jotai";

export type ApiCallResult = Record<string, unknown> | null;

export const loadingAtom = atom(false);
export const resultAtom = atom<ApiCallResult>(null);

export const lastGameIdAtom = atom("");
export const lastEventIdAtom = atom("");
export const lastActionIdAtom = atom("");
