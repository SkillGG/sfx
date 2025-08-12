"use client";

import { type CollapsedOnomatopoeia, cn } from "@/utils";
import { useSFXLangs } from "../../hooks/langs";

export const SFXCard = ({
  sfx,
  disableTLs,
}: {
  sfx: CollapsedOnomatopoeia;
  disableTLs?: boolean;
}) => {
  const { langs } = useSFXLangs();

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-3 shadow-sm dark:border-blue-600 dark:bg-slate-800",
      )}
    >
      <div className={cn("flex flex-row items-baseline gap-2")}>
        <div
          className={cn("text-lg font-bold text-blue-900 dark:text-blue-100")}
        >
          {sfx.text}
        </div>
        {sfx.read && (
          <div className={cn("text-sm text-blue-500 dark:text-blue-400")}>
            {sfx.read}
          </div>
        )}
        <div
          className={cn(
            "flex-1 text-right text-sm text-blue-500 dark:text-blue-400",
          )}
        >
          ({langs.find((l) => l.code === sfx.language)?.name})
        </div>
      </div>

      <div>
        <div className={cn("text-blue-700 dark:text-blue-300")}>{sfx.def}</div>
        <div className={cn("text-sm text-blue-400 dark:text-blue-500")}>
          {sfx.extra ?? ""}
        </div>
      </div>

      {!disableTLs && (
        <div className={cn("flex")}>{/** Translations */}Translations</div>
      )}
    </div>
  );
};
