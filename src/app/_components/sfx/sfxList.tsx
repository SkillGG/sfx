"use client";

import { api } from "@/trpc/react";
import { cn, type CollapsedOnomatopoeia, type Promisable } from "@/utils";
import { SFX, type SFXClasses } from ".";
import type { ClassValue } from "clsx";
import { Spinner } from "../spinner";
import { useState } from "react";
import type { SearchQuery } from "@/app/hooks/search";

export type SeparatedOnomatopoeia = CollapsedOnomatopoeia & { separated: true };

export const SFXListPanel = ({
  editable,
  sfxList,
  customQuery,

  classNames,
  page = 0,
  onPage = 10,

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
  const dbSFX = api.sfx.listSFX.useQuery(
    { ...customQuery, order: "desc", limit: onPage, skip: onPage * page },
    { enabled: !sfxList },
  );

  const [separated, setSeparated] = useState<SeparatedOnomatopoeia[]>([]);

  const sfxs = [...separated, ...(sfxList ?? dbSFX.data ?? [])];

  const separateFn = (sfx: CollapsedOnomatopoeia) => {
    console.log(sfx);
    setSeparated((prev) => [...prev, { ...sfx, separated: true }]);
  };

  if (dbSFX.isLoading || !sfxs) {
    return (
      <div className={(cn(classNames?.loading), "flex h-full")}>
        <Spinner className={cn("mx-auto my-auto")} />
      </div>
    );
  }

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
