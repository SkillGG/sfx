import { cn } from "@/utils";
import { useEffect, useState } from "react";
import type { SearchQuery } from "../page";

const parseSearchQuery = (query: string) => {
  const langRegex = /lang:(?<langs>(?:[a-z]){2,4},?)+/i;
  const langMatch = langRegex.exec(query);

  const langs = langMatch?.groups?.langs?.split(",") ?? [];

  const value = query.replace(langRegex, "").trim();

  return { value, langs };
};

const SearchBar = ({
  value,
  onChange,
}: {
  value: SearchQuery;
  onChange: (value: SearchQuery) => void;
}) => {
  const [search, setSearch] = useState<string>("");

  const [debouncedSearch, setDebouncedSearch] = useState<{
    value: string;
    langs: string[];
  }>(parseSearchQuery(""));

  useEffect(() => {
    setSearch(
      value.value +
        (value.langs.length > 0 ? ` lang:${value.langs.join(",")}` : ""),
    );
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(parseSearchQuery(search));
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    console.log("searchihng for", debouncedSearch);
    onChange(debouncedSearch);
    history.pushState(
      null,
      "",
      `?search=${debouncedSearch.value}${
        debouncedSearch.langs.length > 0
          ? `&langs=${debouncedSearch.langs.join(",")}`
          : ""
      }`,
    );
  }, [onChange, debouncedSearch]);

  return (
    <div className={cn("flex w-fit flex-row gap-2")}>
      <input
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        placeholder="waku waku"
        className={cn(
          "rounded-md border border-blue-500 bg-white p-2 dark:border-blue-400 dark:bg-slate-700",
        )}
      />
    </div>
  );
};

export default SearchBar;
