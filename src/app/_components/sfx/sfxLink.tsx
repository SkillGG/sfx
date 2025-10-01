import { api } from "@/trpc/react";
import { cn } from "@/utils/utils";
import type { ClassValue } from "clsx";
import Link from "next/link";
import { memo } from "react";

const SFXLink = ({
  ids,
  separator = ", ",
  surround,
  className,
}: {
  ids: number[];
  separator?: string;
  surround?: { pre?: string; post?: string };
  className?: ClassValue;
}) => {
  const [sfxs] = api.sfx.listSFX.useSuspenseQuery({ ids: ids, nodedupe: true });

  if (!sfxs || sfxs.length === 0)
    return (
      <div className={cn(className)}>
        Unknown reference to SFX#{ids.join(separator)}
      </div>
    );

  return (
    <>
      {ids.map((id, i, a) => {
        const sfx = sfxs.find((s) => s.id === id);

        if (!sfx)
          return (
            <span className={cn(className)} key={`sfxlink_fail_${id}`}>
              {surround?.pre ?? ""}[NO={id}]{surround?.post ?? ""}
              {i !== a.length - 1 && separator}
            </span>
          );

        return (
          <span key={`sfxlink_${sfx.id}`} className={cn(className)}>
            {surround?.pre ?? ""}
            <Link href={`?id=${sfx.id}`} className="underline" target="_self">
              {sfx.text}
            </Link>
            {surround?.post ?? ""}
            {i !== a.length - 1 && separator}
          </span>
        );
      })}
    </>
  );
};

export default memo(SFXLink, (prev, next) => {
  return prev.ids === next.ids;
});
