"use client";

import { api } from "@/trpc/react";
import DarkModeSwitch, { AccentSwitch } from "./_components/darkModeSwitch";
import AboutDialog from "./_components/aboutDialog";
import { useTheme } from "./hooks/theme";
import { cn } from "@/utils";
import Link from "next/link";
import SearchBar from "./_components/searchBar";
import { Suspense } from "react";
import { SFXListPanel } from "./_components/sfxList.";
import { isValidSearch, SearchProvider, useSearch } from "./hooks/search";
import { Spinner } from "./_components/spinner";
import { CookieBanner } from "./_components/cookieBanner";
import { QuestionMarkSVG } from "./_components/questionMark";

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
    { query: search.query, langs: search.langs, id: search.id },
    {
      enabled: isValidSearch(search, ["#creat", "#edit", "#new", "#dash"]),
    },
  );

  if (isLoading) return <PageLoad key={"load"} />;

  if (
    search.query?.startsWith("#creat") ||
    search.query?.startsWith("#edit") ||
    search.query?.startsWith("#new") ||
    search.query?.startsWith("#dash")
  ) {
    return (
      <div className={cn("py-12 text-center text-lg")}>
        <Link href="/creator" className={cn("text-(--regular-text)")}>
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      {!sfxs || sfxs.length === 0 ? (
        <div
          className={cn("py-12 text-center text-lg", "text-(--regular-text)")}
        >
          No SFX found.
          <br />
          You can request it via email:
          <br />
          <Link
            href="mailto:request@sfxvault.org"
            className={cn("text-(--header-text)")}
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
            container:
              "max-h-[70dvh] overflow-auto px-2 py-1 flex flex-col gap-2",
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

export const SearchPage = () => {
  const { mode, accent } = useTheme();

  return (
    <div
      className={cn(
        "flex h-screen w-full items-center justify-center bg-(--deeper-bg)",
        mode,
      )}
      data-accent={accent}
    >
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl",
          "border border-(--regular-border) bg-(--main-bg)/80 p-8 shadow-lg",
        )}
      >
        <Suspense fallback={<PageLoad key={"load"} />}>
          <SearchProvider>
            <AboutDialog
              id="aboutDialog"
              classNames={{ container: "max-w-sm" }}
            />

            <div className={cn("flex items-center justify-between")}>
              <h1
                className={cn(
                  "text-center text-4xl font-extrabold tracking-tight",
                  "w-fit text-(--header-text)",
                )}
              >
                SFX&nbsp;Vault
                <small
                  className={cn(
                    "block max-w-44 px-2 text-sm font-normal text-balance",
                    "text-(--label-text)",
                  )}
                >
                  SFX translations for use in manga!
                </small>
              </h1>
              <SearchBar />
              <div className={cn("flex items-center gap-2")}>
                <AccentSwitch />
                <DarkModeSwitch />
                <button
                  type="button"
                  aria-label="Open About dialog"
                  popoverTarget="aboutDialog"
                  popoverTargetAction="show"
                  className={cn(
                    "block h-full w-full rounded-full",
                    "absolute top-2 right-2 h-6 w-6 cursor-pointer p-[3px]",
                    "focus:ring-2 focus:ring-(color:--input-focus-border) focus:outline-none",
                  )}
                >
                  <QuestionMarkSVG />
                </button>
              </div>
            </div>
            <hr className={cn("border-(--separator)")} />
            <CookieBanner />
            <List />
          </SearchProvider>
        </Suspense>
      </div>
    </div>
  );
};
