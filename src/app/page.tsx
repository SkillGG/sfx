"use client";

import { api } from "@/trpc/react";
import DarkModeSwitch from "./_components/darkModeSwitch";
import { useDarkMode } from "./hooks/darkmode";
import { cn } from "@/utils";
import Link from "next/link";
import SearchBar from "./_components/searchBar";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SFXListPanel } from "./_components/sfxList.";

export type SearchQuery = {
  value: string;
  langs: string[];
};

const PageLoad = () => {
  const { mode } = useDarkMode();
  return <div className={cn(mode)}>Loading...</div>;
};

const validSearch = (search: SearchQuery) => {
  return search.value.length >= 3 || search.value.length === 0;
};

const Search = ({
  search: fxsearch,
  setSearch: setSearchbarText,
}: {
  search?: SearchQuery | null;
  setSearch: (q: SearchQuery) => void;
}) => {
  const queryParams = useSearchParams();

  const [search, setSearch] = useState<SearchQuery>({
    value: fxsearch?.value ?? queryParams.get("search") ?? "",
    langs: fxsearch?.langs ?? queryParams.get("langs")?.split(",") ?? [],
  });

  const [lastValidSearch, setLastValidSearch] = useState<SearchQuery>(search);

  const { data: sfxs, isLoading } = api.sfx.listSFX.useQuery(
    { query: lastValidSearch.value, langs: lastValidSearch.langs },
    {
      enabled: validSearch(search),
    },
  );

  useEffect(() => {
    if (fxsearch) {
      setSearch(fxsearch);
    }
  }, [fxsearch]);

  useEffect(() => {
    if (validSearch(search)) {
      setLastValidSearch(search);
      setSearchbarText(search);
      history.pushState(
        null,
        "",
        `?search=${search.value}${
          search.langs.length > 0 ? `&langs=${search.langs.join(",")}` : ""
        }`,
      );
    }
  }, [search]);

  useEffect(() => {
    if (validSearch(search)) {
      setLastValidSearch(search);
    }
  }, [search]);

  if (isLoading) return <PageLoad key={"load"} />;

  return (
    <>
      {!sfxs || sfxs.length === 0 ? (
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
            container: "max-h-[70dvh] overflow-auto px-2 flex flex-col gap-2",
            sfxs: {
              default: {
                tls: {
                  sfx: {
                    default: {
                      container: "basis-[45%] grow",
                    },
                  },
                },
              },
            },
          }}
        />
      )}
    </>
  );
};

const SearchPage = () => {
  const { mode } = useDarkMode();

  const [search, setSearch] = useState<SearchQuery | null>(null);

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
          <SearchBar
            value={search ?? { langs: [], value: "" }}
            onChange={setSearch}
          />
          <DarkModeSwitch />
        </div>
        <hr className={cn("mb-4 border-blue-200 dark:border-blue-700")} />
        <Suspense fallback={<PageLoad key={"load"} />}>
          <Search setSearch={setSearch} search={search} />
        </Suspense>
      </div>
    </div>
  );
};

export default function Home() {
  return <SearchPage />;
}
