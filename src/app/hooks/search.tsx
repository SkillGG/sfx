"use client";

import {
  isValidSearch,
  searchParamsToQuery,
  searchQueryToString,
  strToSearchQuery,
  type SearchQuery,
} from "@/utils/searchUtils";
import { type SearchParams } from "@/utils/utils";
import { parseAsString, useQueryStates } from "nuqs";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export const useSearch = (
  searchParams?: Awaited<SearchParams>,
  options?: { history?: "push" | "replace" },
) => {
  const [states, setStates] = useQueryStates(
    {
      q: parseAsString,
      l: parseAsString,
      id: parseAsString,
    },
    { clearOnDefault: true, history: options?.history ?? "push" },
  );

  const params = {
    ...{ q: states.q ?? "", id: states.id ?? "", l: states.l ?? "" },
    ...searchParams,
  };

  const [searchStr, setSearch] = useState<string>(
    searchQueryToString(searchParamsToQuery(params)) ?? "",
  );

  const [searchQuery, setSearchQuery] = useState<SearchQuery>({ stop: false });

  const handleSearch = useCallback(
    (newSearch: string): void => {
      const query = strToSearchQuery(newSearch);
      if (isValidSearch(query)) {
        // console.log("Searching it up!");
        setSearchQuery(query);
        const q = !!query?.query ? query.query : null;
        const id = !!query?.id && query.id > 0 ? query.id.toString() : null;
        const l =
          query?.langs && query?.langs?.length > 0
            ? query.langs.join(",")
            : null;
        void setStates({
          q,
          id,
          l,
        });
      }
    },
    [setStates],
  );

  const search = useDebouncedCallback(handleSearch, 200);

  useEffect(() => {
    search(searchStr);
    const queries = strToSearchQuery(searchStr);
    const q = !!queries?.query ? queries.query : null;
    const id = !!queries?.id && queries.id > 0 ? queries.id.toString() : null;
    const l =
      queries?.langs && queries?.langs?.length > 0
        ? queries.langs.join(",")
        : null;
    void setStates({
      q,
      id,
      l,
    });
  }, [search, searchStr, setStates]);

  useEffect(() => {
    const str = searchQueryToString(searchParamsToQuery(searchParams)) ?? "";
    setSearch(str);
  }, [searchParams]);

  return {
    onChange: setSearch,
    curValue: searchStr,
    query: searchQuery,
    searchIsEmpty:
      !!searchQuery.id ||
      (searchQuery.ids?.length ?? 0) > 0 ||
      !!searchQuery.query ||
      (searchQuery.langs?.length ?? 0) > 0,
  };
};
