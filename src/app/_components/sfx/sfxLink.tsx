import { api } from "@/trpc/react";
import { cn } from "@/utils";
import type { ClassValue } from "clsx";
import Link from "next/link";
import { memo } from "react";

const SFXLink = ({ id, className }: { id: number; className?: ClassValue }) => {
  const [[sfx]] = api.sfx.listSFX.useSuspenseQuery({ id });
  if (!sfx) return null;

  return (
    <>
      <Link
        className={cn("underline", className)}
        href={`?id=${sfx.id}`}
        target="_self"
      >
        {sfx.text}
      </Link>
    </>
  );
};

export default memo(SFXLink, (prev, next) => {
  return prev.id === next.id;
});
