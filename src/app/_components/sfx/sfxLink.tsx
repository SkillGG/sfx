import { api } from "@/trpc/react";
import { cn } from "@/utils";
import type { ClassValue } from "clsx";
import Link from "next/link";

export const SFXLink = ({
  id,
  className,
}: {
  id: number;
  className?: ClassValue;
}) => {
  const [[sfx]] = api.sfx.listSFX.useSuspenseQuery({ id });

  if (!sfx) return null;

  return (
    <>
      <Link className={cn("underline", className)} href={`/?id=${sfx.id}`}>
        {sfx.text}
      </Link>
    </>
  );
};
