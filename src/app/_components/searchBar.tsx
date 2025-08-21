import { cn } from "@/utils";
import { useEffect, useState } from "react";
import { useSearch, type SearchQuery } from "../hooks/search";

const parseSearchQuery = (query: string, stop: boolean) => {
  const langRegex = /lang:(?<langs>(?:[a-z]){2,4},?)+/i;
  const langMatch = langRegex.exec(query);

  const langs = langMatch?.groups?.langs?.split(",") ?? [];

  const value = query.replace(langRegex, "").trim();

  return { value, langs, stop };
};

const SearchBar = () => {
  const globalSearch = useSearch();

  const [search, setSearch] = useState<string>(
    globalSearch.search.value +
      (globalSearch.search.langs.length ? " " : "") +
      globalSearch.search.langs.map((q) => `lang:${q}`).join(" "),
  );

  const [debouncedSearch, setDebouncedSearch] = useState<SearchQuery>(
    parseSearchQuery("", globalSearch.search.stop),
  );

  useEffect(() => {
    if (globalSearch.search.stop) return;
    setSearch(
      globalSearch.search.value +
        (globalSearch.search.langs.length > 0
          ? ` lang:${globalSearch.search.langs.join(",")}`
          : ""),
    );
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
          "focus:border-(color:input-focus-border) focus:ring-1 focus:outline-none",
          "dark:placeholder-(--input-placeholder-text)",
          "border-(color:--input-border)",
          "focus:ring-(color:--input-focus-border)",
        )}
      />
    </div>
  );
};

export default SearchBar;
