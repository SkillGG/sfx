"use client";

import { cn } from "@/utils";

type CookiesDialogClassNames = {
  container?: string;
  closeButton?: string;
  content?: string;
  title?: string;
  paragraph?: string;
  link?: string;
};

export const CookiesDialog = ({
  id,
  classNames,
}: {
  id: string;
  classNames?: CookiesDialogClassNames;
}) => {
  return (
    <dialog
      id={id}
      popover={"auto"}
      className={cn(
        "m-auto min-w-[50%] rounded-xl border border-(--regular-border)",
        "bg-(--dialog-bg)/50 p-6 shadow-lg backdrop-blur-sm",
        classNames?.container,
      )}
    >
      <button
        type="button"
        aria-label="Close"
        popoverTarget={id}
        popoverTargetAction="hide"
        className={cn(
          "absolute top-5 right-4 z-10 rounded-full bg-(--button-neutral-bg)/20 px-2",
          "cursor-pointer text-(--button-neutral-text) hover:inset-ring-1",
          "block hover:bg-(--button-neutral-hover-bg)/30",
          "hover:inset-ring-(color:--button-neutral-inset-ring)",
          classNames?.closeButton,
        )}
      >
        ×
      </button>
      <div className={cn("space-y-3", classNames?.content)}>
        <h2
          className={cn(
            "text-2xl font-semibold text-(color:--header-text)",
            classNames?.title,
          )}
        >
          Cookies notice
        </h2>
        <p className={cn("text-(--regular-text)", classNames?.paragraph)}>
          We only use strictly necessary cookies provided by our hosting
          provider (Vercel) to deliver the website reliably and securely. No
          analytics, tracking, or marketing cookies are used.
        </p>
        <div className={cn("mt-4 grid grid-cols-1 gap-3")}>
          <a
            href="https://vercel.com/docs/privacy-policy#cookies"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex flex-col rounded-lg px-4 py-3",
              "bg-(--button-neutral-bg)/20",
              "text-(--button-neutral-text)",
              "shadow-sm",
              "hover:bg-(--button-neutral-hover-bg)/30",
              "focus:ring-2",
              "focus:ring-(color:--input-focus-border)",
              classNames?.link,
            )}
          >
            <span className={cn("text-sm text-(--label-text)")}>
              Learn more
            </span>
            <span
              className={cn(
                "text-base font-medium text-(--button-submit-nobg-text)",
              )}
            >
              Vercel cookies policy
            </span>
          </a>
        </div>
      </div>
    </dialog>
  );
};

export default CookiesDialog;
