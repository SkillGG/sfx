"use client";

import { api } from "@/trpc/react";
import { SFXCard } from "./_components/sfx";
import DarkModeSwitch from "./_components/darkModeSwitch";
import { useDarkMode } from "./hooks/darkmode";
import { cn } from "@/utils";
import Link from "next/link";

export default function Home() {
  const { data: sfx, isLoading } = api.sfx.listSFX.useQuery({});

  const { mode } = useDarkMode();

  console.log(sfx);

  if (isLoading)
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
            "mx-auto mt-16 w-fit rounded border border-blue-200 bg-white p-8 text-lg text-blue-700 shadow dark:border-blue-700 dark:bg-slate-800/80 dark:text-blue-200",
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
          "z-10 mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl border border-blue-200 bg-white/80 p-8 shadow-lg dark:border-blue-700 dark:bg-slate-800/80 dark:text-blue-100",
        )}
      >
        <div className={cn("mb-2 flex items-center justify-between")}>
          <h1
            className={cn(
              "m-0 text-4xl font-extrabold tracking-tight text-blue-900 dark:text-blue-100",
            )}
          >
            SFX Vault
          </h1>
          <DarkModeSwitch />
        </div>
        <hr className={cn("mb-4 border-blue-200 dark:border-blue-700")} />
        {!sfx || sfx.length === 0 ? (
          <div
            className={cn(
              "py-12 text-center text-lg text-blue-500 dark:text-blue-300",
            )}
          >
            No SFX found.
            <br />
            <Link
              href="/creator"
              className={cn("text-blue-700 dark:text-blue-500")}
            >
              Create one!
            </Link>
          </div>
        ) : (
          <ul className={cn("flex flex-col gap-6")}>
            {sfx.map((sfx) => (
              <li
                key={sfx.id}
                className={cn(
                  "transition hover:scale-[1.02] hover:shadow-md dark:rounded-lg dark:hover:bg-slate-700/60",
                )}
              >
                <SFXCard sfx={sfx} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
