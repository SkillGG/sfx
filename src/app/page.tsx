"use client";

import { api } from "@/trpc/react";
import DarkModeSwitch from "./_components/darkModeSwitch";
import { useDarkMode } from "./hooks/darkmode";
import { cn } from "@/utils";
import Link from "next/link";
import SearchBar from "./_components/searchBar";
import { Suspense } from "react";
import { SFXListPanel } from "./_components/sfxList.";
import { isValidSearch, SearchProvider, useSearch } from "./hooks/search";

const PageLoad = () => {
  const { mode } = useDarkMode();
  return <div className={cn(mode)}>Loading...</div>;
};

const List = () => {
  const { search } = useSearch();

  const { data: sfxs, isLoading } = api.sfx.listSFX.useQuery(
    { query: search.value, langs: search.langs },
    {
      enabled: isValidSearch(search),
    },
  );

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
        <Suspense fallback={<PageLoad key={"load"} />}>
          <SearchProvider>
            <div className={cn("mb-2 flex items-center justify-between")}>
              <h1
                className={cn(
                  "m-0 text-4xl font-extrabold tracking-tight",
                  "text-blue-900 dark:text-blue-100",
                )}
              >
                SFX Vault
              </h1>
              <SearchBar />
              <DarkModeSwitch />
            </div>
            <hr className={cn("mb-4 border-blue-200 dark:border-blue-700")} />
            <List />
          </SearchProvider>
        </Suspense>
      </div>
    </div>
  );
};

export default function Home() {
  return <SearchPage />;
}
