import { cn } from "@/utils";
import type { ClassValue } from "clsx";

export const Spinner = ({ className }: { className?: ClassValue }) => {
  return (
    <div
      className={cn(
        "h-8 w-8 animate-spin rounded-full border-4 border-(--spinner-color) border-t-transparent",
        className,
      )}
      aria-label="Loading spinner"
    />
  );
};
