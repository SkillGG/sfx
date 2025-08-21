import { api } from "@/trpc/react";
import { cn, type CollapsedOnomatopoeia, type Promisable } from "@/utils";
import { SFX, type SFXClasses } from "./sfx";
import type { ClassValue } from "clsx";
import { Spinner } from "../creator/page";

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
    return (
      <div className={(cn(classNames?.loading), "flex h-full")}>
        <Spinner className={cn("mx-auto my-auto")} />
      </div>
    );
  }

  return (
    <div className={cn(classNames?.container)}>
      {sfxs.map((sfx) => {
        return (
          <SFX
            sfx={sfx}
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
