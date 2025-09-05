import { api } from "@/trpc/react";
import { cn } from "@/utils/utils";
import Image from "next/image";
import { useRef } from "react";
import { AsyncImage } from "../asyncImage";

export const LocalImg = ({
  filename,
  alt,
  nonDB,
}: {
  filename: string;
  alt: string;
  nonDB?: React.ReactNode;
}) => {
  const [img] = nonDB
    ? [filename]
    : api.picture.getPicture.useSuspenseQuery(filename);

  const popupRef = useRef<HTMLDialogElement>(null);

  if (typeof img !== "string")
    return (
      <span className={cn("text-(--error-text)")} title={img.err.message}>
        {alt}
      </span>
    );

  const src = nonDB ? img : `data:image/png;base64,${img}`;

  return (
    <>
      <div
        className={cn(
          "relative z-0 h-fit max-h-[100px] w-fit font-bold",
          "before:items-center before:bg-(--accent-600)",
          "before:text-black before:opacity-0",
          "before:absolute before:hidden before:h-full",
          "before:w-full before:justify-center before:content-['show']",
          "hover:cursor-pointer hover:before:flex hover:before:opacity-75",
          "text-center hover:before:wrap-anywhere hover:before:break-all",
        )}
        onClick={() => {
          popupRef.current?.showPopover();
        }}
      >
        {nonDB ? (
          <AsyncImage
            src={src}
            fallback={nonDB}
            alt={alt}
            unoptimized
            priority={true}
            height={0}
            width={0}
            className={cn(
              "-z-10 h-[100px] w-auto",
              "relative hover:cursor-pointer",
            )}
            containerClassName={cn("w-fit h-full")}
            style={{ position: "initial", width: "auto" }}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={0}
            height={0}
            unoptimized
            className={cn("h-[100px] w-auto", "hover:cursor-pointer")}
          />
        )}
      </div>
      <dialog
        ref={popupRef}
        popover="auto"
        className={cn(
          "absolute top-0 right-0 left-0 cursor-pointer",
          "z-20 h-full w-full items-center justify-center",
          "bg-(--dialog-bg)/70",
        )}
        onClick={() => {
          popupRef.current?.hidePopover();
        }}
      >
        <div className={cn("flex h-full w-full items-center justify-center")}>
          {nonDB ? (
            <AsyncImage
              fallback={nonDB}
              width={0}
              height={0}
              containerClassName={cn("z-30")}
              className={cn("z-40 h-auto w-auto")}
              src={src}
              alt={alt}
              unoptimized
              priority={true}
              loader={({ src }) => src}
            />
          ) : (
            <Image
              width={0}
              height={0}
              unoptimized
              className={cn("h-auto w-auto")}
              src={src}
              alt={alt}
            />
          )}
        </div>
      </dialog>
    </>
  );
};
