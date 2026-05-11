import { atom } from "jotai";

export const apiUrlAtom = atom(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
);
export const userIdAtom = atom("");
