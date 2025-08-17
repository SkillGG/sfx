import { api } from "@/trpc/react";
import { cn, type CollapsedOnomatopoeia, type Promisable } from "@/utils";
import { SFX, type SFXClasses } from "./sfx";
import type { ClassValue } from "clsx";

export const SFXListPanel = ({
  editable,
  sfxList,

  classNames,

  onSave,
  onRemove,
}: {
  editable?: boolean;
  sfxList?: CollapsedOnomatopoeia[];

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
    { order: "desc" },
    { enabled: !sfxList },
  );

  const sfxs = sfxList ?? dbSFX.data;

  if (dbSFX.isLoading || !sfxs) {
    return <div className={cn(classNames?.loading)}>Loading SFX List</div>;
  }

  return (
    <div className={cn(classNames?.container)}>
      {sfxs
        .reduce<CollapsedOnomatopoeia[]>(
          (arr: CollapsedOnomatopoeia[], sfx: CollapsedOnomatopoeia) => {
            // if already in the list above, remove
            const prevIn = arr.find((sx) =>
              sx.tls.find((tl) => tl.tlSFX.id === sfx.id),
            );
            if (prevIn) {
              if (prevIn.prime) {
                return arr;
              } else {
                return [...arr.filter((q) => q.id !== prevIn.id), sfx];
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
