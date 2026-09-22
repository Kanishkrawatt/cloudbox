import type { NextRouter } from "next/router";
import { PREFILL_KEY, type Prefill } from "@/pages/smartshare";

/** Sends a set of existing files to the Smart Share page as a new share. */
export const shareThese = (router: NextRouter, prefill: Prefill) => {
  try {
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify(prefill));
  } catch {
    /* fall through: the page just opens empty */
  }
  router.push("/smartshare");
};
