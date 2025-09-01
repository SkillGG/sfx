import { cn } from "@/utils";
import type { SFXField } from "./parse";
import { Suspense } from "react";
import { LocalImg } from "./localImg";
import { Spinner } from "../spinner";

export const SFXFieldPanel = ({ field }: { field: SFXField }) => {
  switch (field.type) {
    case "string":
      return (
        <div className={cn("inline", field.classNames)}>
          {field.counter ? `${field.counter}.` : ""}
          {field.value}
        </div>
      );
    case "img":
      const alt = `Example ${field.index}`;
      const img = (
        <Suspense
          key={`${field.index}_img_${field.url}`}
          fallback={<Spinner className={cn("h-[75px] w-[75px]")} />}
        >
          {field.url.startsWith("@") ? (
            <LocalImg alt={alt} filename={field.url.substring(1)} />
          ) : (
            <LocalImg
              alt={alt}
              filename={field.url}
              nonDB={<Spinner className={cn("h-[75px] w-[75px]")} />}
            />
          )}
        </Suspense>
      );

      return img;
    default:
      return null;
  }
};
