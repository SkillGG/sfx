"use client";

import { useState } from "react";
import { cn } from "@/utils";
import { QuestionMarkSVG } from "./questionMark";
import CookiesDialog from "./cookiesDialog";

export const CookieBanner = () => {
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  if (!showCookieBanner) return null;

  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50 border-t",
        "border-(--banner-border) bg-(--banner-bg)/70 p-4 bg-blend-saturation",
        "shadow-[var(--banner-shadow)]",
      )}
    >
      <CookiesDialog
        id="cookiesDialog"
        classNames={{ container: "max-w-sm" }}
      />
      <div
        className={cn(
          "mx-auto flex max-w-2xl items-center justify-between gap-4",
        )}
      >
        <div
          className={cn("flex w-fit items-center text-sm text-(--banner-text)")}
        >
          <p className={cn("text-center text-balance")}>
            This website uses necessary cookies to function properly. By using
            this site, you agree to our use of cookies.
          </p>
          <button
            type="button"
            aria-label="Open cookies notice"
            popoverTarget="cookiesDialog"
            popoverTargetAction="show"
            className={cn(
              "block rounded-full",
              "h-8 w-8 cursor-pointer p-[3px]",
              "focus:ring-2 focus:ring-(color:--input-focus-border)",
              "focus:ring-offset-2 focus:ring-offset-(color:--dialog-bg) focus:outline-none",
            )}
          >
            <QuestionMarkSVG classNames={{ svg: cn("bg-transparent") }} />
          </button>
        </div>
        <button
          onClick={() => setShowCookieBanner(false)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium",
            "bg-(--button-submit-bg) text-(--button-submit-text)",
            "hover:bg-(--button-submit-hover-bg)",
            "focus:ring-2 focus:ring-(color:--input-focus-border) focus:outline-none",
            "focus:ring-offset-2 focus:ring-offset-(--dialog-bg)",
          )}
        >
          OK
        </button>
      </div>
    </div>
  );
};
