import { cn } from "@/utils";
import { useEffect, useState } from "react";
import { useSearch, type SearchQuery } from "../hooks/search";

const parseSearchQuery = (query: string, stop: boolean): SearchQuery => {
  const langRegex = /lang:(?<langs>(?:[a-z]){2,4},?)+/i;
  const langMatch = langRegex.exec(query);

  const langs = langMatch?.groups?.langs?.split(",") ?? [];

  const idRegex = /id:(?<id>\d+)/i;
  const idMatch = idRegex.exec(query);

  const id = Number(idMatch?.groups?.id) || 0;

  const value = query.replace(langRegex, "").replace(idRegex, "").trim();

  return { query: value, langs, stop, id: id > 0 ? id : 0 };
};

const queryToString = (query: SearchQuery): string => {
  const qStr = query.query ?? "";

  const langs = query.langs?.map((q) => `lang:${q}`).join(" ") ?? "";

  const idStr = `${(query.id ?? 0) > 0 ? `id:${query.id}` : ""}`;

  const space1 = !!qStr ? " " : "";
  const space2 = !!qStr || !!langs.length ? " " : "";

  return `${qStr}${!!langs ? space1 + langs : ""}${!!idStr ? space2 + idStr : ""}`;
};

const SearchBar = () => {
  const globalSearch = useSearch();

  const [search, setSearch] = useState<string>(
    queryToString(globalSearch.search),
  );

  const [debouncedSearch, setDebouncedSearch] = useState<SearchQuery>(
    parseSearchQuery("", globalSearch.search.stop),
  );

  useEffect(() => {
    if (globalSearch.search.stop) return;
    setSearch(queryToString(globalSearch.search));
  }, [globalSearch.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(parseSearchQuery(search, false));
    }, 500);

    return () => clearTimeout(timer);
  }, [globalSearch.search.stop, search]);

  useEffect(() => {
    globalSearch.setSearch(debouncedSearch);
  }, [debouncedSearch, globalSearch]);

  return (
    <div className={cn("flex w-fit flex-row gap-2")}>
      <input
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        placeholder="waku waku"
        className={cn(
          "rounded border bg-(color:--input-bg) px-2 py-2 text-(color:--input-text)",
          "border-(color:--input-border) placeholder-(--input-placeholder-text)",
          "focus:border-(color:input-focus-border) focus:ring-1 focus:outline-none",
          "focus:ring-(color:--input-focus-border)",
        )}
      />
    </div>
  );
};

export default SearchBar;
