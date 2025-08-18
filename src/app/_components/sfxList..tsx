import { api } from "@/trpc/react";
import { cn, type CollapsedOnomatopoeia, type Promisable } from "@/utils";
import { SFX, type SFXClasses } from "./sfx";
import type { ClassValue } from "clsx";

export const SFXListPanel = ({
  editable,
  sfxList,

  classNames,
  page = 0,
  onPage = 10,

  onSave,
  onRemove,
}: {
  editable?: boolean;
  sfxList?: CollapsedOnomatopoeia[];

  page?: number;
  onPage?: number;

  classNames?: {
    container?: ClassValue;
    sfxs?: SFXClasses;
    loading?: ClassValue;
  };

  onSave?: (
    old: CollapsedOnomatopoeia,
    prev: CollapsedOnomatopoeia,
  ) => Promisable<CollapsedOnomatopoeia | void>;
  onRemove?: (sfx: CollapsedOnomatopoeia) => Promisable<void>;
}) => {
  const dbSFX = api.sfx.listSFX.useQuery(
    { order: "desc", limit: onPage, skip: onPage * page },
    { enabled: !sfxList },
  );

  const sfxs = sfxList ?? dbSFX.data;

  if (dbSFX.isLoading || !sfxs) {
    return <div className={cn(classNames?.loading)}>Loading SFX List</div>;
  }

  console.log(sfxs);

  return (
    <div className={cn(classNames?.container)}>
      {sfxs
        .reduce<CollapsedOnomatopoeia[]>(
          (arr: CollapsedOnomatopoeia[], sfx: CollapsedOnomatopoeia) => {
            // if already in the list above, remove
            const prevIn = arr.filter(
              (sx) => sx.tls.filter((tl) => tl.tlSFX.id === sfx.id).length > 0,
            );

            if (prevIn.length > 0) {
              // there would be a duplicate SFX if inserted now

              if (prevIn.some((q) => q.prime)) {
                // there is already a prime SFX in the list, don't add this one
                return arr;
              } else {
                // there is no prime SFX in the list yet, remove previous ones and make
                return [
                  ...arr.filter((q) => !prevIn.some((z) => q.id === z.id)),
                  sfx,
                ];
              }
            }

            return [...arr, sfx];
          },
          [],
        )
        .map((sfx) => {
          return (
            <SFX
              sfx={sfx}
              withTL
              editable={editable}
              classNames={classNames?.sfxs}
              key={`sfx_${sfx.id}`}
              onRemove={async () => {
                await onRemove?.(sfx);
              }}
              onSave={async (fx) => {
                await onSave?.(sfx, fx);
              }}
            />
          );
        })}
    </div>
  );
};
