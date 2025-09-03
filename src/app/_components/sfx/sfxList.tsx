"use client";

import { api } from "@/trpc/react";
import { cn, type CollapsedOnomatopoeia, type Promisable } from "@/utils/utils";
import { SFX, type SFXClasses } from ".";
import type { ClassValue } from "clsx";
import { useState } from "react";
import type { SearchQuery } from "@/app/hooks/search";

export type SeparatedOnomatopoeia = CollapsedOnomatopoeia & { separated: true };

export const DEFAULT_PAGE = 0;
export const DEFAULT_ON_PAGE = 10;

export const SFXListPanel = ({
  editable,
  sfxList,
  customQuery,

  classNames,
  page = DEFAULT_PAGE,
  onPage = DEFAULT_ON_PAGE,

  allowSeparate,

  onSave,
  onRemove,
}: {
  editable?: boolean;
  sfxList?: CollapsedOnomatopoeia[];
  customQuery?: SearchQuery;

  page?: number;
  onPage?: number;

  allowSeparate?: boolean;

  classNames?: {
    container?: ClassValue;
    sfxs?: SFXClasses;
    loading?: ClassValue;
  };

  onSave?: (
    old: CollapsedOnomatopoeia,
    prev: CollapsedOnomatopoeia,
  ) => Promisable<CollapsedOnomatopoeia | void>;
  onRemove?: (
    sfx: CollapsedOnomatopoeia | SeparatedOnomatopoeia,
  ) => Promisable<void>;
}) => {
  const [dbSFX] = sfxList
    ? ([sfxList] as const)
    : api.sfx.listSFX.useSuspenseQuery({
        ...customQuery,
        order: "desc",
        limit: onPage,
        skip: onPage * page,
      });

  const [separated, setSeparated] = useState<SeparatedOnomatopoeia[]>([]);

  const sfxs = [...separated, ...dbSFX];

  const separateFn = (sfx: CollapsedOnomatopoeia) => {
    console.log(sfx);
    setSeparated((prev) => [...prev, { ...sfx, separated: true }]);
  };

  return (
    <ul
      className={cn(classNames?.container)}
      aria-label="SFX results"
      role="list"
    >
      {sfxs.map((sfx) => {
        return (
          <li key={`sfx_${sfx.id}`} className={cn("list-none")}>
            <SFX
              labels={
                "separated" in sfx
                  ? {
                      removeDefault: "Hide",
                      removing: "Hide",
                    }
                  : { separate: "Show as standalone" }
              }
              separate={
                allowSeparate && !("separated" in sfx) ? separateFn : undefined
              }
              sfx={sfx}
              editable={editable}
              classNames={classNames?.sfxs}
              onRemove={async () => {
                await onRemove?.(sfx);
                setSeparated((prev) => prev.filter((q) => q.id !== sfx.id));
              }}
              onSave={async (fx) => {
                await onSave?.(sfx, fx);
              }}
            />
          </li>
        );
      })}
    </ul>
  );
};
