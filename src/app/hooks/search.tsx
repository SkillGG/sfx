"use client";

import { useRouter, useSearchParams } from "next/navigation";
// darkmode hook, provider and context

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export type SearchQuery = {
  value: string;
  langs: string[];
  stop: boolean;
};

const SearchContext = createContext<{
  search: SearchQuery;
  setSearch: Dispatch<SetStateAction<SearchQuery>>;
} | null>(null);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context)
    throw new Error("useSearch must be used within a SearchProvider");
  return context;
};

export const isValidSearch = (search: SearchQuery) => {
  return (
    !search.stop && (search.value.length >= 3 || search.value.length === 0)
  );
};

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const queryParams = useSearchParams();

  const router = useRouter();

  const langs = queryParams
    .get("l")
    ?.split(",")
    .filter((l) => !!l);

  const [search, setSearch] = useState<SearchQuery>({
    langs: langs ?? [],
    value: queryParams.get("q") ?? "",
    stop: true,
  });

  const [lastValidSearch, setValidSearch] = useState(search);

  useEffect(() => {
    if (isValidSearch(search)) {
      setValidSearch(search);
      router.replace(
        `${location.pathname}/?q=${search.value}&l=${search.langs.join(",")}`,
      );
    }
  }, [router, search]);

  return (
    <SearchContext.Provider value={{ search: lastValidSearch, setSearch }}>
      {children}
    </SearchContext.Provider>
  );
};
