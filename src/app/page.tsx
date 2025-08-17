"use client";

import { api } from "@/trpc/react";
import DarkModeSwitch from "./_components/darkModeSwitch";
import { useDarkMode } from "./hooks/darkmode";
import { cn } from "@/utils";
import Link from "next/link";
import SearchBar from "./_components/searchBar";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SFXListPanel } from "./_components/sfxList.";

export type SearchQuery = {
  value: string;
  langs: string[];
};

const validSearch = (search: SearchQuery) => {
  return search.value.length > 3 || search.value.length === 0;
};

export default function Home() {
  const queryParams = useSearchParams();

  const [search, setSearch] = useState<SearchQuery>({
    value: "",
    langs: [],
  });

  const [lastValidSearch, setLastValidSearch] = useState<SearchQuery>(search);

  const { data: sfxs, isLoading } = api.sfx.listSFX.useQuery(
    { query: lastValidSearch.value, langs: lastValidSearch.langs },
    {
      enabled: validSearch(search),
    },
  );

  useEffect(() => {
    const value = queryParams.get("search");
    const langs = queryParams.get("langs");
    setSearch({
      value: value ?? "",
      langs: langs?.split(",") ?? [],
    });
  }, [queryParams]);

  useEffect(() => {
    if (validSearch(search)) {
      setLastValidSearch(search);
    }
  }, [search]);

  const { mode } = useDarkMode();

  if (isLoading && !validSearch(search))
    return (
      <div
        className={cn(
          "flex h-screen w-full items-center justify-center",
          mode,
          "dark:bg-slate-900",
        )}
      >
        <div
          className={cn(
            "mx-auto mt-16 w-fit rounded border border-blue-200 bg-white p-8",
            "text-lg text-blue-700 shadow dark:border-blue-700",
            "dark:bg-slate-800/80 dark:text-blue-200",
            mode,
          )}
        >
          Loading...
        </div>
      </div>
    );

  return (
    <div
      className={cn(
        "flex h-screen w-full items-center justify-center",
        mode,
        "dark:bg-slate-900",
      )}
    >
      <div
        className={cn(
          "z-10 mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl",
          "border border-blue-200 bg-white/80 p-8 shadow-lg",
          "dark:border-blue-700 dark:bg-slate-800/80 dark:text-blue-100",
        )}
      >
        <div className={cn("mb-2 flex items-center justify-between")}>
          <h1
            className={cn(
              "m-0 text-4xl font-extrabold tracking-tight",
              "text-blue-900 dark:text-blue-100",
            )}
          >
            SFX Vault
          </h1>
          <SearchBar value={search} onChange={setSearch} />
          <DarkModeSwitch />
        </div>
        <hr className={cn("mb-4 border-blue-200 dark:border-blue-700")} />
        {isLoading && validSearch(search) ? (
          <div>Loading...</div>
        ) : !sfxs || sfxs.length === 0 ? (
          <div
            className={cn(
              "py-12 text-center text-lg",
              "text-blue-500 dark:text-blue-300",
            )}
          >
            No SFX found.
            <br />
            <Link
              href="/creator"
              className={cn("text-blue-700", "dark:text-blue-500")}
            >
              Create one!
            </Link>
          </div>
        ) : (
          <SFXListPanel
            sfxList={sfxs}
            classNames={{
              sfxs: {
                default: {
                  tls: {
                    sfx: {
                      default: {
                        container: "w-full",
                      },
                    },
                  },
                },
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
