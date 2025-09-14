import { api } from "@/trpc/react";
import { cn } from "@/utils/utils";
import type { ClassValue } from "clsx";
import Link from "next/link";
import { memo } from "react";

const SFXLink = ({
  ids,
  className,
}: {
  ids: number[];
  className?: ClassValue;
}) => {
  const [sfxs] = api.sfx.listSFX.useSuspenseQuery({ ids: ids, nodedupe: true });

  if (!sfxs || sfxs.length === 0)
    return (
      <div className={cn(className)}>
        Unknown reference to SFX#{ids.join(", ")}
      </div>
    );

  return (
    <>
      {ids.map((id, i, a) => {
        const sfx = sfxs.find((s) => s.id === id);

        if (!sfx)
          return (
            <span className={cn(className)} key={`sfxlink_fail_${id}`}>
              [NO={id}]{i !== a.length - 1 && ", "}
            </span>
          );

        return (
          <span key={`sfxlink_${sfx.id}`} className={cn(className)}>
            <Link href={`?id=${sfx.id}`} className="underline" target="_self">
              {sfx.text}
            </Link>
            {i !== a.length - 1 && ", "}
          </span>
        );
      })}
    </>
  );
};

export default memo(SFXLink, (prev, next) => {
  return prev.ids === next.ids;
});
