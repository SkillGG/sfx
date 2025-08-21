"use client";

import { api } from "@/trpc/react";
import DarkModeSwitch, { AccentSwitch } from "./_components/darkModeSwitch";
import { useTheme } from "./hooks/theme";
import { cn } from "@/utils";
import Link from "next/link";
import SearchBar from "./_components/searchBar";
import { Suspense } from "react";
import { SFXListPanel } from "./_components/sfxList.";
import { isValidSearch, SearchProvider, useSearch } from "./hooks/search";
import { Spinner } from "./_components/spinner";

const PageLoad = () => {
  const { mode } = useTheme();
  return (
    <div className={cn(mode)}>
      <Spinner className={cn("m-auto")} />
    </div>
  );
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

  if (
    search.value.startsWith("#creat") ||
    search.value.startsWith("#edit") ||
    search.value.startsWith("#new") ||
    search.value.startsWith("#dash")
  ) {
    return (
      <div
        className={cn(
          "py-12 text-center text-lg",
          "text-(color:--accent-500) dark:text-(color:--accent-300)",
        )}
      >
        <Link
          href="/creator"
          className={cn(
            "text-(color:--accent-700) dark:text-(color:--accent-500)",
          )}
        >
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      {!sfxs || sfxs.length === 0 ? (
        <div
          className={cn(
            "py-12 text-center text-lg",
            "text-(color:--accent-500) dark:text-(color:--accent-300)",
          )}
        >
          No SFX found.
          <br />
          You can request it via email:
          <br />
          <Link
            href="mailto:request@sfxvault.org"
            className={cn(
              "text-(color:--accent-700)",
              "dark:text-(color:--accent-500)",
            )}
          >
            request@sfxvault.org
          </Link>
          <br />
          And I&apos;ll add it asap
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
  const { mode, accent } = useTheme();
  return (
    <div
      className={cn(
        "flex h-screen w-full items-center justify-center",
        mode,
        "dark:bg-slate-900",
      )}
      data-accent={accent}
    >
      <div
        className={cn(
          "z-10 mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl",
          "border border-(color:--regular-border) bg-white/80 p-8 shadow-lg",
          "dark:bg-slate-800/80 dark:text-(color:--accent-100)",
        )}
      >
        <Suspense fallback={<PageLoad key={"load"} />}>
          <SearchProvider>
            <div className={cn("mb-2 flex items-center justify-between")}>
              <h1
                className={cn(
                  "m-0 text-4xl font-extrabold tracking-tight",
                  "text-(color:--accent-900) dark:text-(color:--accent-100)",
                )}
              >
                SFX Vault*
              </h1>
              <SearchBar />
              <div className={cn("flex items-center gap-2")}>
                <AccentSwitch />
                <DarkModeSwitch />
              </div>
            </div>
            <hr
              className={cn(
                "mb-4 border-(color:--accent-200) dark:border-(color:--accent-700)",
              )}
            />
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
