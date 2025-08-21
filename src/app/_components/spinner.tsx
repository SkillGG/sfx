import { cn } from "@/utils";
import type { ClassValue } from "clsx";

export const Spinner = ({ className }: { className?: ClassValue }) => {
  return (
    <div
      className={cn(
        "h-8 w-8 animate-spin rounded-full border-4 border-(color:--accent-400) border-t-transparent",
        "dark:border-(color:--accent-300) dark:border-t-transparent",
        className,
      )}
      aria-label="Loading spinner"
    />
  );
};
