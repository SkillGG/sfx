"use client";

import { api } from "@/trpc/react";
import DarkModeSwitch, { AccentSwitch } from "./_components/darkModeSwitch";
import AboutDialog from "./_components/aboutDialog";
import { useTheme } from "./hooks/theme";
import { cn, type SearchParams } from "@/utils/utils";
import Link from "next/link";
import SearchBar from "./_components/searchBar";
import { Suspense } from "react";
import { SFXListPanel } from "./_components/sfx/sfxList";
import { useSearch } from "./hooks/search";
import { Spinner } from "./_components/spinner";
import { CookieBanner } from "./_components/cookieBanner";
import { QuestionMarkSVG } from "./_components/questionMark";
import { isValidSearch, type SearchQuery } from "@/utils/searchUtils";

const PageLoad = () => {
  const { mode } = useTheme();
  return (
    <section className={cn(mode)} aria-busy="true" aria-live="polite">
      <Spinner className={cn("m-auto")} />
    </section>
  );
};

const List = ({ query }: { query: SearchQuery }) => {
  const { data: sfxs, isLoading } = api.sfx.listSFX.useQuery(
    { query: query.query, langs: query.langs, id: query.id },
    {
      enabled: isValidSearch(query, ["#creat", "#edit", "#new", "#dash"]),
    },
  );

  if (isLoading) return <PageLoad key={"load"} />;

  if (
    query.query?.startsWith("#creat") ||
    query.query?.startsWith("#edit") ||
    query.query?.startsWith("#new") ||
    query.query?.startsWith("#dash")
  ) {
    return (
      <section className={cn("py-12 text-center text-lg")}>
        <Link href="/creator" className={cn("text-(--regular-text)")}>
          Dashboard
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="Search results">
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
        <Suspense
          fallback={
            <div className={"flex h-full"}>
              <Spinner className={cn("mx-auto my-auto")} />
            </div>
          }
        >
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
        </Suspense>
      )}
    </section>
  );
};

export const SearchPage = ({
  searchParams,
}: {
  searchParams: Awaited<SearchParams>;
}) => {
  const search = useSearch(searchParams);

  const { mode, accent } = useTheme();

  return (
    <main
      className={cn(
        "flex h-screen w-full items-center justify-center bg-(--deeper-bg)",
        mode,
      )}
      data-accent={accent}
    >
      <section
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl",
          "border border-(--regular-border) bg-(--main-bg)/80 p-8 shadow-lg",
        )}
        aria-label="Search layout"
      >
        <Suspense fallback={<PageLoad key={"load"} />}>
          <AboutDialog
            id="aboutDialog"
            classNames={{ container: "max-w-sm" }}
          />

          <header className={cn("flex items-center justify-between")}>
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
            <SearchBar setSearch={search.onChange} value={search.curValue} />
            <nav className={cn("flex items-center gap-2")} aria-label="Theme">
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
            </nav>
          </header>

          <hr className={cn("border-(--separator)")} />
          <CookieBanner />
          <List query={search.query} />
        </Suspense>
      </section>
    </main>
  );
};
