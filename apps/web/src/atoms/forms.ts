import { atom } from "jotai";

export const gameNameAtom = atom("");
export const updateGameIdAtom = atom("");
export const updateGameNameAtom = atom("");
export const deleteGameIdAtom = atom("");

export const eventTitleAtom = atom("");
export const eventGameIdAtom = atom("");
export const eventStakeAtom = atom("[1,2]");
export const updateEventIdAtom = atom("");
export const updateEventTitleAtom = atom("");
export const deleteEventIdAtom = atom("");

export const actionEventIdAtom = atom("");
export const actionTypeAtom = atom("buy_in");
export const actionAmountAtom = atom("100");
export const updateActionIdAtom = atom("");
export const updateActionAmountAtom = atom("");
export const deleteActionIdAtom = atom("");
