import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import type { datatype } from "@/components/types";

/**
 * Page-wide multi-select over files and images, keyed by URL so the same item
 * can be picked from any grid on the page. Cleared on navigation.
 */
type SelectionState = {
  items: datatype[];
  has: (url: string) => boolean;
  toggle: (item: datatype) => void;
  clear: () => void;
};

const SelectionContext = createContext<SelectionState>({
  items: [],
  has: () => false,
  toggle: () => {},
  clear: () => {},
});

export const useSelection = () => useContext(SelectionContext);

export const SelectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [map, setMap] = useState<Map<string, datatype>>(new Map());
  const router = useRouter();

  const clear = useCallback(() => setMap(new Map()), []);
  useEffect(() => {
    router.events.on("routeChangeStart", clear);
    return () => router.events.off("routeChangeStart", clear);
  }, [router.events, clear]);

  const toggle = useCallback((item: datatype) => {
    setMap((prev) => {
      const next = new Map(prev);
      if (next.has(item.url)) next.delete(item.url);
      else next.set(item.url, item);
      return next;
    });
  }, []);

  const value = useMemo<SelectionState>(
    () => ({ items: Array.from(map.values()), has: (url) => map.has(url), toggle, clear }),
    [map, toggle, clear]
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
};

export default SelectionProvider;
