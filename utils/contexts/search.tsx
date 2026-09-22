import { createContext, useContext, useMemo, useState } from "react";
export { filterItems, filterGroups } from "@/utils/search";

type searchContextType = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchContext = createContext<searchContextType>({
  query: "",
  setQuery: () => {},
});

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [query, setQuery] = useState("");
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};

export default SearchProvider;
