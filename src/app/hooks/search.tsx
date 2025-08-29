"use client";

import { type SearchOptions } from "@/utils";
import { useRouter, useSearchParams } from "next/navigation";
// darkmode hook, provider and context

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export type SearchQuery = Exclude<SearchOptions, "list"> & {
  stop: boolean;
  linked?: boolean;
};

const SearchContext = createContext<{
  search: SearchQuery;
  setSearch: Dispatch<SetStateAction<SearchQuery>>;
} | null>(null);

export const parseSearchQuery = (query: string, stop: boolean): SearchQuery => {
  const langRegex = /lang:(?<langs>(?:[a-z]{2,4},?)+)/gi;

  const langs: string[] = [];

  for (
    let match = langRegex.exec(query);
    !!match;
    match = langRegex.exec(query)
  ) {
    if (match.groups?.langs) {
      langs.push(...match.groups.langs.split(","));
    }
  }

  const idRegex = /id:(?<id>\d+)/gi;
  const idMatch = idRegex.exec(query);

  const id = Number(idMatch?.groups?.id) || 0;

  const value = query.replace(langRegex, "").replace(idRegex, "").trim();

  return { query: value, langs, stop, id: id > 0 ? id : 0 };
};

export const queryToString = (query: SearchQuery): string => {
  const qStr = query.query ?? "";

  const langs = query.langs?.join(",") ?? "";

  const langQ = langs.length > 0 ? `lang:${langs}` : "";

  const idStr = `${(query.id ?? 0) > 0 ? `id:${query.id}` : ""}`;

  const space1 = !!qStr ? " " : "";
  const space2 = !!qStr || !!langs.length ? " " : "";

  return `${qStr}${!!langQ ? space1 + langQ : ""}${!!idStr ? space2 + idStr : ""}`;
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context)
    throw new Error("useSearch must be used within a SearchProvider");
  return context;
};

export const isValidSearch = (
  search: SearchQuery,
  invalidStrings: string[] = [],
) => {
  const qLength = search.query?.length ?? 0;
  const lLength = search.langs?.length ?? 0;
  const id = search.id ?? 0;
  if (invalidStrings.some((str) => !!search.query?.includes(str))) return false;
  if (search.stop) return false;
  return qLength >= 3 || qLength === 0 || lLength > 0 || id > 0;
};

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const queryParams = useSearchParams();

  const router = useRouter();

  const langs = queryParams.get("l")?.split(",").filter(Boolean) ?? [];
  const strId = queryParams.get("id") ?? "0";
  const id = parseInt(strId) || 0;

  const [search, setSearch] = useState<SearchQuery>({
    langs,
    query: queryParams.get("q") ?? "",
    id,
    stop: true,
  });

  const [lastValidSearch, setValidSearch] = useState(search);

  useEffect(() => {
    if (isValidSearch(search)) {
      setValidSearch(search);

      const newurl = new URL(location.href);

      const changeVal = (url: URL, k: string, b: string) => {
        if (!!b) url.searchParams.set(k, b);
        else url.searchParams.delete(k);
      };

      console.log("value of search changed", search);

      changeVal(newurl, "q", search.query ?? "");
      changeVal(newurl, "l", search.langs?.join(",") ?? "");
      changeVal(
        newurl,
        "id",
        Number(search.id) > 0 ? `${Number(search.id)}` : "",
      );

      console.log("newURL", newurl.toString());

      router.replace(newurl.toString());
    }
  }, [router, search]);

  const data = useMemo(() => {
    return { search: lastValidSearch, setSearch };
  }, [lastValidSearch]);

  return (
    <SearchContext.Provider value={data}>{children}</SearchContext.Provider>
  );
};
