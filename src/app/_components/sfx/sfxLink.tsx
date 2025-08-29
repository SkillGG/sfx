import { useSearch } from "@/app/hooks/search";
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
  const search = useSearch();
  if (!sfx) return null;

  return (
    <>
      <Link
        className={cn("underline", className)}
        href={`/?id=${sfx.id}`}
        onClick={() => {
          search.setSearch({ id, stop: false, linked: true });
        }}
      >
        {sfx.text}
      </Link>
    </>
  );
};
