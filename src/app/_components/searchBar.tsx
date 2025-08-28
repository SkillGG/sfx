import { cn } from "@/utils";
import { useEffect, useState } from "react";
import {
  parseSearchQuery,
  queryToString,
  useSearch,
  type SearchQuery,
} from "../hooks/search";

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
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className={cn("flex w-fit flex-row gap-2")}
      aria-label="Search SFX"
    >
      <label className={cn("sr-only")}>Search SFX</label>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        placeholder="waku waku"
        className={cn(
          "rounded border bg-(color:--input-bg) px-2 py-2 text-(color:--input-text)",
          "border-(color:--input-border) placeholder-(--input-placeholder-text)",
          "focus:border-(color:input-focus-border)",
          "focus:ring-1 focus:outline-none",
          "focus:ring-(color:--input-focus-border)",
        )}
        aria-label="Search SFX"
        autoComplete="off"
        name="q"
      />
    </form>
  );
};

export default SearchBar;
